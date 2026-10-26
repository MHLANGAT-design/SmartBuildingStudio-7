import sys
import os
import json
import math
import re
import tempfile
import ezdxf
from ezdxf.math import Matrix44


# ─── Layer classification patterns ───────────────────────────────────────────
#
# Classification runs in strict priority order inside classify_layer():
#
#   1. Parent semantic tag (when recursing into a block)
#   2. Doors
#   3. Windows
#   4. Structural (beams, columns, framing, bearing walls)
#   5. Emergency lights
#   6. Luminaires
#   7. Walls (explicit — A-WALL, WALL, S-WALL, WALL-FULL, etc.)
#   8. Fallthrough: entity's own layer, unless it matches an exclusion keyword
#
# Anything that reaches step 8 with a clean layer name is passed through
# to the C# side with its raw layer name. The C# classifier treats those
# as ElementType.RawGeometry — real drawing content, but not a wall,
# door, window, or fixture.
#
# ── Boundary classes: [-_\s] ──
#
# Every pattern uses hyphen, underscore, AND whitespace as segment
# separators. ArchiCAD interleaves spaces with hyphens — the layer
# "2 Structural - Walls_Pen__41" has " - " (space-hyphen-space) around
# the segment and appends "_Pen_No__<N>" to every layer name.
#
# \b is deliberately NOT used for word boundaries. It fails before "_"
# because underscore is a word character in Python's regex engine — so
# \blamp\b does not match "Lamp_Pen_No__1". Explicit [-_\s] boundaries
# are the only form that works on ArchiCAD's "_Pen_" suffix.
#
# ── ArchiCAD pen-set suffix ──
#
# ArchiCAD appends "_Pen_No__<N>" (or "_Pen__<N>") to every layer name
# to identify the pen-set the layer belongs to. The number is local to
# the export — it carries no semantic meaning and varies between files.
# classify_layer() strips the suffix before matching, so all pens of a
# layer classify identically. The original name (with suffix) is
# preserved in the fallthrough return so the client can still tell
# pens apart if it wants to.
#
# ── Block grouping ──
#
# When traverse_entity recurses into a door or window INSERT, the
# INSERT's handle becomes the "group_id" for every shape emitted from
# inside that block. Shapes sharing a group_id belong to the same
# physical door / window and are combined into one DoorData /
# WindowData on the client.
#
# Non-door, non-window blocks (detail blocks, container blocks) pass
# the parent group_id through unchanged, so nested geometry inside a
# door still reports the door's group.
#
# ── Block name propagation ──
#
# Each emitted shape now carries `block_name` — the name of the DXF
# block it was extracted from, or None if it was a direct modelspace
# entity. This is what lets the client distinguish ArchiCAD's door
# variants (e.g. a block named "Door Double" vs a block named "Door")
# when the geometry itself is identical. The field is additive; older
# consumers ignore it.

DOOR_LAYER_RE = re.compile(
    r'(^|[-_\s])doors?([-_\s]|$)'
    r'|^a[-_\s]dr$'
    r'|^dr$'
    r'|^dr[-_\s]\d+$'
    r'|^d[-_\s]?\d+$',
    re.IGNORECASE,
)

WINDOW_LAYER_RE = re.compile(
    r'win'
    r'|glaz'
    r'|sash'
    r'|^a[-_\s]wd$'
    r'|^wd$'
    r'|^wd[-_\s]\d+$'
    r'|^w[-_\s]?\d+$',
    re.IGNORECASE,
)

STRUCTURAL_LAYER_RE = re.compile(
    r'(^|[-_\s])cols?([-_\s]|$)'
    r'|(^|[-_\s])beams?([-_\s]|$)'
    r'|(^|[-_\s])bm([-_\s]|$)'
    r'|(^|[-_\s])fram([-_\s]|$)'
    r'|(^|[-_\s])bearings?([-_\s]|$)'
    r'|^c[-_\s]?\d+$'
    r'|^b[-_\s]?\d+$',
    re.IGNORECASE,
)

EMERGENCY_LAYER_RE = re.compile(
    r'emergency'
    r'|em[-_\s]?lum'
    r'|lum[-_\s]?em'
    r'|em[-_\s]?light'
    r'|el[-_\s]?fixture',
    re.IGNORECASE,
)

LUMINAIRE_LAYER_RE = re.compile(
    r'(^|[-_\s])gluds?([-_\s]|$)'
    r'|(^|[-_\s])lamps?([-_\s]|$)'
    r'|(^|[-_\s])luminaires?([-_\s]|$)'
    r'|(^|[-_\s])lums?([-_\s]|$)'
    r'|\d{1,3}w[-_\s]'
    r'|\d{3,4}k[-_\s]',
    re.IGNORECASE,
)

WALL_LAYER_RE = re.compile(
    r'(^|[-_\s])walls?([-_\s]|$)',
    re.IGNORECASE,
)

PEN_SUFFIX_RE = re.compile(r'_pen(_no)?_+\d+$', re.IGNORECASE)


def strip_pen_suffix(layer_name):
    """Remove ArchiCAD's _Pen_No__N / _Pen__N suffix if present."""
    return PEN_SUFFIX_RE.sub('', layer_name)


def extract_dxf_architectural_plan(dxf_path):
    try:
        doc = ezdxf.readfile(dxf_path)
    except Exception:
        from ezdxf import recover
        doc, _ = recover.readfile(dxf_path)

    msp = doc.modelspace()
    shapes = []

    EXCLUDE_TYPES = (
        'TEXT', 'MTEXT', 'DIMENSION', 'LEADER', 'ATTRIB', 'ATTDEF', 'WIPEOUT',
        'HATCH', 'SOLID', 'TRACE', '3DFACE',
    )

    EXCLUDE_KEYWORDS = (
        'dim', 'text', 'marker', 'grid', 'zone', 'bic', 'stair',
        'furniture', 'site', 'paving', 'tile', 'slab', 'model unit',
        'drafting', 'hatch_paving', 'anno',
    )

    def is_clean_primitive_layer(layer_name):
        l_name = layer_name.lower()
        return not any(ex in l_name for ex in EXCLUDE_KEYWORDS)

    def transform_pt(pt, matrix):
        vec = matrix.transform(pt)
        return [vec.x, vec.y]

    def is_paving_pattern(pts):
        if len(pts) < 2:
            return True
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        dx = max(xs) - min(xs)
        dy = max(ys) - min(ys)
        return (dx < 0.05 and dy < 0.05)

    def classify_layer(entity_layer, parent_layer):
        if parent_layer in ("Semantic_Door", "Semantic_Window"):
            return parent_layer

        base_layer = strip_pen_suffix(entity_layer)

        if DOOR_LAYER_RE.search(base_layer):
            return "Semantic_Door"
        if WINDOW_LAYER_RE.search(base_layer):
            return "Semantic_Window"
        if STRUCTURAL_LAYER_RE.search(base_layer):
            return "Semantic_Wall_Structural"
        if EMERGENCY_LAYER_RE.search(base_layer):
            return "Semantic_Fixture_emergencyLight"
        if LUMINAIRE_LAYER_RE.search(base_layer):
            return "Semantic_Fixture_luminaire"
        if WALL_LAYER_RE.search(base_layer):
            return "Semantic_Wall"

        effective = entity_layer if entity_layer != '0' else parent_layer
        if not is_clean_primitive_layer(effective):
            return None
        return effective

    def process_primitive(
        entity,
        transform_matrix,
        parent_layer,
        group_id=None,
        block_name=None,
    ):
        dxftype = entity.dxftype()
        if dxftype in EXCLUDE_TYPES:
            return

        entity_layer = getattr(entity.dxf, 'layer', '0')
        effective_layer = classify_layer(entity_layer, parent_layer)
        if effective_layer is None:
            return

        pts = []
        is_closed = False

        if dxftype == 'LINE':
            pts = [
                transform_pt(entity.dxf.start, transform_matrix),
                transform_pt(entity.dxf.end, transform_matrix)
            ]

        elif dxftype in ('LWPOLYLINE', 'POLYLINE'):
            try:
                if dxftype == 'LWPOLYLINE':
                    raw_pts = [pt[:2] for pt in entity.get_points('xy')]
                else:
                    raw_pts = [v.dxf.location for v in entity.vertices]
                pts = [transform_pt(p, transform_matrix) for p in raw_pts]
                is_closed = entity.is_closed
            except Exception:
                pass

        elif dxftype == 'ARC':
            try:
                center = entity.dxf.center
                radius = entity.dxf.radius
                start_angle = math.radians(entity.dxf.start_angle)
                end_angle = math.radians(entity.dxf.end_angle)
                if end_angle < start_angle:
                    end_angle += 2 * math.pi

                steps = max(8, int(abs(end_angle - start_angle) / (math.pi / 16)))
                for i in range(steps + 1):
                    a = start_angle + (end_angle - start_angle) * (i / steps)
                    px = center.x + radius * math.cos(a)
                    py = center.y + radius * math.sin(a)
                    pz = getattr(center, 'z', 0.0)
                    pts.append(transform_pt((px, py, pz), transform_matrix))
            except Exception:
                pass

        elif dxftype == 'CIRCLE':
            try:
                center = entity.dxf.center
                radius = entity.dxf.radius
                steps = 16
                for i in range(steps + 1):
                    a = 2 * math.pi * (i / steps)
                    px = center.x + radius * math.cos(a)
                    py = center.y + radius * math.sin(a)
                    pz = getattr(center, 'z', 0.0)
                    pts.append(transform_pt((px, py, pz), transform_matrix))
                is_closed = True
            except Exception:
                pass

        if len(pts) > 1 and not is_paving_pattern(pts):
            shapes.append({
                "type": "polyline",
                "points": pts,
                "is_closed": is_closed,
                "layer": effective_layer,
                "group_id": group_id,
                # Forward the DXF block name (or None for a direct
                # modelspace entity). ArchiCAD's door / window blocks
                # carry the single-vs-double distinction in the block
                # name; the geometry alone can be identical.
                "block_name": block_name,
            })

    def traverse_entity(
        entity,
        current_matrix,
        parent_layer,
        group_id=None,
        block_name=None,
    ):
        dxftype = entity.dxftype()
        if dxftype in EXCLUDE_TYPES:
            return

        entity_layer = getattr(entity.dxf, 'layer', '0')
        effective_layer = entity_layer if entity_layer != '0' else parent_layer

        if dxftype == 'INSERT':
            this_block_name = entity.dxf.name
            layer_name = effective_layer

            is_door = bool(DOOR_LAYER_RE.search(this_block_name)) or bool(DOOR_LAYER_RE.search(layer_name))
            is_window = bool(WINDOW_LAYER_RE.search(this_block_name)) or bool(WINDOW_LAYER_RE.search(layer_name))

            if is_door:
                semantic_layer = "Semantic_Door"
            elif is_window:
                semantic_layer = "Semantic_Window"
            else:
                semantic_layer = "Visual_Geometry"

            # The INSERT's handle identifies this block instance. Every
            # entity inside shares it, which is what lets the client
            # combine N segments into one door / window.
            #
            # Only door and window INSERTs start a new group. Nested
            # blocks inside a door keep the parent's group so the whole
            # door reports one id. Non-semantic INSERTs (containers,
            # detail blocks) pass the parent group through unchanged.
            if is_door or is_window:
                inner_group_id = getattr(entity.dxf, 'handle', None) or group_id
            else:
                inner_group_id = group_id

            if entity.dxf.name in doc.blocks:
                block = doc.blocks[entity.dxf.name]
                insert_matrix = entity.matrix44()
                combined_matrix = current_matrix * insert_matrix

                for block_entity in block:
                    traverse_entity(
                        block_entity,
                        combined_matrix,
                        semantic_layer,
                        inner_group_id,
                        # Door / window INSERTs are the source of truth
                        # for the block name. Nested blocks inside a
                        # door keep the outer block's name so the whole
                        # door reports one name.
                        this_block_name if (is_door or is_window) else block_name,
                    )
        else:
            process_primitive(
                entity,
                current_matrix,
                effective_layer,
                group_id,
                block_name,
            )

    identity_matrix = Matrix44()
    for entity in msp:
        traverse_entity(entity, identity_matrix, getattr(entity.dxf, 'layer', '0'))

    # ─── TEMPORARY DIAGNOSTIC ─────────────────────────────────────────
    # Write every emitted shape's group_id, block_name, layer, and
    # element count to a debug file in the OS temp directory. Used to
    # confirm whether ArchiCAD's single vs. double door distinction is
    # visible in the block name (it is not visible in the geometry).
    # Remove this block once the door classification is settled.
    try:
        grouped = {}
        for s in shapes:
            gk = s.get("group_id") or "__ungrouped__"
            entry = grouped.setdefault(gk, {
                "group_id": s.get("group_id"),
                "block_name": s.get("block_name"),
                "layer": s.get("layer"),
                "element_count": 0,
                "sample_points": None,
            })
            entry["element_count"] += 1
            if entry["sample_points"] is None:
                entry["sample_points"] = s.get("points", [])[:4]

        debug_path = os.path.join(tempfile.gettempdir(), "dxf_import_debug.json")
        with open(debug_path, "w", encoding="utf-8") as fh:
            json.dump({
                "total_shapes": len(shapes),
                "groups": list(grouped.values()),
            }, fh, indent=2)
        print(f"[app.py debug] wrote {debug_path}", file=sys.stderr)
    except Exception as exc:
        print(f"[app.py debug] failed to write debug file: {exc}", file=sys.stderr)
    # ─────────────────────────────────────────────────────────────────

    return shapes


if __name__ == "__main__":
    if len(sys.argv) > 1:
        dxf_file_path = sys.argv[1]
        extracted_shapes = extract_dxf_architectural_plan(dxf_file_path)
        print(json.dumps(extracted_shapes))
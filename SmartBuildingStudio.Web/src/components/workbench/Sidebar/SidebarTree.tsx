import { ReactNode } from "react";
import SidebarTreeItem from "./SidebarTreeItem";

export interface SidebarTreeNode {
    id: string;
    label: string;
    icon?: ReactNode;
    badge?: ReactNode;
    disabled?: boolean;
    children?: SidebarTreeNode[];
}

export interface SidebarTreeProps {
    nodes: SidebarTreeNode[];
    selectedId?: string | null;
    className?: string;
    onSelect?: (id: string) => void;
}

export default function SidebarTree({
    nodes,
    selectedId,
    className = "",
    onSelect
}: SidebarTreeProps) {
    return (
        <div className={`overflow-y-auto overflow-x-hidden flex-1 ${className}`}>
            {nodes.map(node => (
                <TreeNode
                    key={node.id}
                    node={node}
                    level={0}
                    selectedId={selectedId}
                    onSelect={onSelect}
                />
            ))}
        </div>
    );
}

interface TreeNodeProps {
    node: SidebarTreeNode;
    level: number;
    selectedId?: string | null;
    onSelect?: (id: string) => void;
}

function TreeNode({
    node,
    level,
    selectedId,
    onSelect
}: TreeNodeProps) {
    const hasChildren = !!node.children && node.children.length > 0;

    return (
        <SidebarTreeItem
            id={node.id}
            label={node.label}
            icon={node.icon}
            badge={node.badge}
            disabled={node.disabled}
            level={level}
            expandable={hasChildren}
            selected={selectedId === node.id}
            onClick={onSelect}
        >
            {node.children?.map(child => (
                <TreeNode
                    key={child.id}
                    node={child}
                    level={level + 1}
                    selectedId={selectedId}
                    onSelect={onSelect}
                />
            ))}
        </SidebarTreeItem>
    );
}

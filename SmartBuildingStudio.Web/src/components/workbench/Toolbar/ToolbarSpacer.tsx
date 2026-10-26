interface ToolbarSpacerProps {
    size?: "sm" | "md" | "lg";
}

export default function ToolbarSpacer({ size = "md" }: ToolbarSpacerProps) {
    const width = size === "sm" ? "w-2" : size === "lg" ? "w-8" : "w-4";

    return (
        <div className={`flex-shrink-0 ${width}`} aria-hidden="true" />
    );
}

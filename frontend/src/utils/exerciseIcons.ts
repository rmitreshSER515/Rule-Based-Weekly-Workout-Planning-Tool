import React from "react";

/**
 * Each entry maps a regex pattern (case-insensitive) to an SVG icon path.
 * The first match wins, so more specific patterns should come before generic ones.
 */
interface IconMapping {
    pattern: RegExp;
    label: string;
    /** SVG path data drawn inside a 24×24 viewBox */
    svgPaths: string[];
}

const ICON_MAPPINGS: IconMapping[] = [
    {
        pattern: /cycling|biking|bike|cyclist/i,
        label: "Cycling",
        svgPaths: [
            // Bicycle icon
            "M5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
            "M19 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
            "M12 15l-3-8h6l-2 4h4",
            "M9 7h2",
        ],
    },
    {
        pattern: /swim|swimming|pool/i,
        label: "Swimming",
        svgPaths: [
            // Waves + swimmer
            "M2 18c1.5-1 3-1.5 4.5 0s3 1 4.5 0 3-1.5 4.5 0 3 1 4.5 0",
            "M2 14c1.5-1 3-1.5 4.5 0s3 1 4.5 0 3-1.5 4.5 0 3 1 4.5 0",
            "M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
            "M10 10l3 2 3-3",
        ],
    },
    {
        pattern: /weight|lifting|deadlift|bench\s*press|squat|dumbbell|barbell/i,
        label: "Weights",
        svgPaths: [
            // Dumbbell icon
            "M6.5 6.5a2 2 0 0 0-3 0v11a2 2 0 0 0 3 0",
            "M17.5 6.5a2 2 0 0 1 3 0v11a2 2 0 0 1-3 0",
            "M6.5 12h11",
            "M3 8v8",
            "M21 8v8",
        ],
    },
    {
        pattern: /football|touchdown/i,
        label: "Football",
        svgPaths: [
            // Football icon
            "M6 6c8-2 12 2 12 6s-4 8-12 6",
            "M6 6c-2 8 2 12 6 12s8-4 6-12",
            "M9 9l6 6",
            "M9.5 12.5l1.5-1.5",
            "M11.5 14.5l1.5-1.5",
        ],
    },
    {
        pattern: /basketball|hoops/i,
        label: "Basketball",
        svgPaths: [
            // Basketball icon
            "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
            "M2 12h20",
            "M12 2a15 15 0 0 1 0 20",
            "M12 2a15 15 0 0 0 0 20",
        ],
    },
    {
        pattern: /running|jogging|run(?!g)|jog|sprint/i,
        label: "Running",
        svgPaths: [
            // Runner icon
            "M15 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
            "M12.5 9.5L10 12l-2 1 1 4 4-1 2-3",
            "M6 20l3-6",
            "M16 14l2 6",
        ],
    },
    {
        pattern: /soccer/i,
        label: "Soccer",
        svgPaths: [
            // Soccer ball
            "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
            "M12 7l3.5 2.5-1.5 4h-4l-1.5-4z",
        ],
    },
    {
        pattern: /tennis|racket/i,
        label: "Tennis",
        svgPaths: [
            // Tennis racket
            "M14.5 3.5a5 5 0 0 1 6 6L13 17l-6.5-6.5z",
            "M6.5 10.5L3 21l10.5-3.5",
            "M6.5 10.5l-3 3",
        ],
    },
    {
        pattern: /yoga|pilates|stretch/i,
        label: "Yoga",
        svgPaths: [
            // Yoga/lotus pose
            "M12 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
            "M6 20h12",
            "M12 4v6",
            "M8 10l4 2 4-2",
            "M8 14l4 6 4-6",
        ],
    },
];

/** Fallback dumbbell/generic activity icon */
const DEFAULT_SVG_PATHS = [
    // Simple generic activity star
    "M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z",
];

/**
 * Returns a React SVG element for the given exercise name.
 * Matches the name against known sport patterns and returns the
 * corresponding icon. Falls back to a generic icon.
 *
 * @param name - Exercise name to match icons against
 * @param size - CSS size string, default "1em"
 */
export function getExerciseIcon(
    name: string,
    size: string = "1em",
): React.ReactElement {
    let paths = DEFAULT_SVG_PATHS;
    let label = "Exercise";

    for (const mapping of ICON_MAPPINGS) {
        if (mapping.pattern.test(name)) {
            paths = mapping.svgPaths;
            label = mapping.label;
            break;
        }
    }

    return React.createElement(
        "svg",
        {
            width: size,
            height: size,
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            "aria-label": label,
            className: "shrink-0",
        },
        ...paths.map((d, i) =>
            React.createElement("path", { key: i, d }),
        ),
    );
}

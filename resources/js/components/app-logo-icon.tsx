import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 150 42" xmlns="http://www.w3.org/2000/svg">
            <text x="50%" y="30" textAnchor="middle" fontSize="24" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif">
                <tspan fill="#e11d48">CV</tspan>
                <tspan fill="currentColor">Generator</tspan>
            </text>
        </svg>
    );
}

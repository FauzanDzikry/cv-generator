import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 200 42" xmlns="http://www.w3.org/2000/svg">
            <text x="2" y="30" fontSize="24" fontWeight="bold" fill="currentColor" fontFamily="system-ui, -apple-system, sans-serif">
                CVGenerator
            </text>
        </svg>
    );
}

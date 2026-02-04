'use client';

import Image from 'next/image';
import { useState } from 'react';

interface TrafficSignImageProps {
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
    priority?: boolean;
}

export function TrafficSignImage({
    src,
    alt,
    className = '',
    width = 200,
    height = 200,
    priority = false,
}: TrafficSignImageProps) {
    const [imgSrc, setImgSrc] = useState(src);
    const [hasError, setHasError] = useState(false);

    // Normalize image path
    const normalizeImagePath = (path: string): string => {
        // Remove any leading slashes and 'images/' prefix
        let normalized = path.replace(/^\/+/, '').replace(/^images\//, '');

        // Extract filename from path
        const filename = normalized.split('/').pop() || '';
        const category = normalized.split('/')[normalized.split('/').length - 2] || 'signs';

        // Try to map common variations
        const variants = [
            `/images/signs/${category}/${filename}`,
            `/images/signs/${category}/${filename.replace(/-v\d+/, '')}`,
            `/images/signs/${category}/${filename.replace(/_\d+/, '')}`,
            `/images/signs/${category}/${filename.replace(/-links/, 'a').replace(/-rechts/, 'b')}`,
            `/images/signs/${category}/${filename.toLowerCase()}`,
            `/images/signs/bicycle_signs/${filename}`,
            `/images/signs/additional_signs/${filename}`,
        ];

        return variants[0];
    };

    const handleError = () => {
        if (!hasError) {
            setHasError(true);
            // Try alternative paths
            const alternatives = [
                imgSrc.replace(/-v\d+/, ''),
                imgSrc.replace(/_\d+/, ''),
                imgSrc.replace(/delineation_signs/, 'bicycle_signs'),
                imgSrc.replace(/additional_signs/, 'bicycle_signs'),
                '/images/signs/placeholder.png',
            ];

            const nextSrc = alternatives.find(alt => alt !== imgSrc);
            if (nextSrc) {
                setImgSrc(nextSrc);
                setHasError(false);
            }
        }
    };

    // Show placeholder if all attempts failed
    if (hasError) {
        return (
            <div
                className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
                style={{ width, height }}
            >
                <div className="text-center p-4">
                    <svg
                        className="w-12 h-12 text-gray-400 mx-auto mb-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                    <p className="text-xs text-gray-500">{alt}</p>
                </div>
            </div>
        );
    }

    return (
        <Image
            src={normalizeImagePath(imgSrc)}
            alt={alt}
            width={width}
            height={height}
            className={className}
            priority={priority}
            onError={handleError}
            unoptimized
        />
    );
}

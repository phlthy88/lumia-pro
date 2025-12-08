import React from 'react';
import { isFeatureEnabled } from '../config/features';

interface FeatureGateProps {
    feature: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ feature, children, fallback = null }) => {
    if (isFeatureEnabled(feature)) {
        return <>{children}</>;
    }
    return <>{fallback}</>;
};

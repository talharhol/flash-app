import React from 'react';
import { Canvas } from '@benjeau/react-native-draw';

const Drawable: React.FC = () => {
    return (
        <Canvas onPathsChange={console.log} simplifyOptions={{ simplifyPaths: true }} />
    );
};

export default Drawable;

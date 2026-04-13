# ML Models

Place the MobileSAM TFLite model file here.

## How to get the model

Download `sam_mobile.tflite` from HuggingFace:
https://huggingface.co/dhkim2810/MobileSAM/tree/main

Look for a `.tflite` export, or use the ONNX → TFLite conversion script below.

### Alternative: EfficientSAM (smaller, similar quality)
https://huggingface.co/spaces/SkalskiP/EfficientSAM

### Expected model contract
- Input 0: Float32Array, shape [MODEL_SIZE * MODEL_SIZE * 3] — flattened RGB image, normalized to [0, 1]
- Input 1: Float32Array, shape [2] — normalized tap point [x, y] both in [0, 1]
- Output 0: Float32Array, shape [MODEL_SIZE * MODEL_SIZE] — binary mask (values > 0.5 = foreground)

MODEL_SIZE is defined in hooks/useHoldDetection.ts (default 256).
Adjust it to match whatever model you download.

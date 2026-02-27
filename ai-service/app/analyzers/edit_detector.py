import numpy as np
from PIL import Image
import io
import cv2
from typing import Dict

class EditDetector:
    """
    Detects image manipulation and editing using multiple techniques:
    - Error Level Analysis (ELA)
    - Clone detection
    - Lighting inconsistencies
    - Compression artifacts
    """
    
    def __init__(self):
        self.model = None
    
    async def load_model(self):
        """Initialize edit detection models"""
        print("✅ Edit Detector initialized")
    
    async def analyze(self, image_data: bytes) -> Dict:
        """
        Analyze image for signs of manipulation
        """
        try:
            image = Image.open(io.BytesIO(image_data))
            img_array = np.array(image)
            
            # Run various detection methods
            ela_result = self._error_level_analysis(image_data)
            clone_result = self._detect_cloning(img_array)
            lighting_result = self._analyze_lighting(img_array)
            compression_result = self._analyze_compression(image)
            
            # Combine results
            edit_probability = (
                ela_result["score"] * 0.3 +
                clone_result["score"] * 0.25 +
                lighting_result["score"] * 0.25 +
                compression_result["score"] * 0.2
            )
            
            return {
                "is_edited": edit_probability > 0.5,
                "probability": round(edit_probability, 4),
                "ela_analysis": ela_result,
                "clone_detection": clone_result,
                "lighting_analysis": lighting_result,
                "compression_analysis": compression_result,
            }
            
        except Exception as e:
            print(f"❌ Edit detection failed: {e}")
            return {
                "is_edited": False,
                "probability": 0.0,
                "error": str(e)
            }
    
    def _error_level_analysis(self, image_data: bytes) -> Dict:
        """
        Error Level Analysis - re-save at known quality and compare
        Edited areas will have different error levels
        """
        try:
            original = Image.open(io.BytesIO(image_data))
            
            # Re-save at 95% quality
            temp_buffer = io.BytesIO()
            original.save(temp_buffer, format='JPEG', quality=95)
            temp_buffer.seek(0)
            resaved = Image.open(temp_buffer)
            
            # Calculate difference
            diff = np.array(original, dtype=float) - np.array(resaved, dtype=float)
            ela_image = np.abs(diff).astype(np.uint8)
            
            # Calculate ELA score
            ela_score = np.mean(ela_image) / 255.0
            
            # High ELA score in specific regions suggests editing
            max_regional_score = np.max([
                np.mean(ela_image[i:i+50, j:j+50])
                for i in range(0, ela_image.shape[0]-50, 50)
                for j in range(0, ela_image.shape[1]-50, 50)
            ]) / 255.0
            
            return {
                "found": ela_score > 0.15,
                "score": round(ela_score, 4),
                "max_regional_score": round(max_regional_score, 4),
                "details": "Areas with different error levels detected"
            }
            
        except Exception as e:
            return {
                "found": False,
                "score": 0.0,
                "error": str(e)
            }
    
    def _detect_cloning(self, img_array: np.ndarray) -> Dict:
        """
        Detect cloned/copied regions using feature matching
        """
        try:
            # Convert to grayscale
            if len(img_array.shape) == 3:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = img_array
            
            # Detect keypoints
            sift = cv2.SIFT_create()
            keypoints, descriptors = sift.detectAndCompute(gray, None)
            
            if descriptors is None or len(descriptors) < 10:
                return {
                    "found": False,
                    "score": 0.0,
                    "regions": 0
                }
            
            # Match features to find duplicates
            bf = cv2.BFMatcher()
            matches = bf.knnMatch(descriptors, descriptors, k=3)
            
            # Find self-matches (excluding exact same point)
            clone_matches = []
            for match in matches:
                if len(match) >= 2:
                    m, n = match[0], match[1]
                    if m.distance < 0.7 * n.distance and m.trainIdx != m.queryIdx:
                        clone_matches.append(m)
            
            clone_score = min(len(clone_matches) / 100.0, 1.0)
            
            return {
                "found": len(clone_matches) > 20,
                "score": round(clone_score, 4),
                "regions": len(clone_matches),
                "details": f"{len(clone_matches)} potential cloned regions detected"
            }
            
        except Exception as e:
            return {
                "found": False,
                "score": 0.0,
                "error": str(e)
            }
    
    def _analyze_lighting(self, img_array: np.ndarray) -> Dict:
        """
        Analyze lighting consistency across image
        Composite images often have inconsistent lighting
        """
        try:
            # Divide image into regions
            h, w = img_array.shape[:2]
            region_size = 64
            
            lighting_vectors = []
            
            for i in range(0, h - region_size, region_size):
                for j in range(0, w - region_size, region_size):
                    region = img_array[i:i+region_size, j:j+region_size]
                    
                    # Calculate lighting direction (simplified)
                    # In reality, use more sophisticated methods
                    if len(region.shape) == 3:
                        gray_region = cv2.cvtColor(region, cv2.COLOR_RGB2GRAY)
                    else:
                        gray_region = region
                    
                    # Gradient analysis
                    gx = cv2.Sobel(gray_region, cv2.CV_64F, 1, 0, ksize=3)
                    gy = cv2.Sobel(gray_region, cv2.CV_64F, 0, 1, ksize=3)
                    
                    mean_gx = np.mean(gx)
                    mean_gy = np.mean(gy)
                    
                    lighting_vectors.append((mean_gx, mean_gy))
            
            # Calculate consistency
            lighting_vectors = np.array(lighting_vectors)
            std_x = np.std(lighting_vectors[:, 0])
            std_y = np.std(lighting_vectors[:, 1])
            
            inconsistency_score = min((std_x + std_y) / 100.0, 1.0)
            
            return {
                "found": inconsistency_score > 0.6,
                "score": round(inconsistency_score, 4),
                "details": "Lighting direction variance detected across regions"
            }
            
        except Exception as e:
            return {
                "found": False,
                "score": 0.0,
                "error": str(e)
            }
    
    def _analyze_compression(self, image: Image.Image) -> Dict:
        """
        Analyze JPEG compression artifacts
        Different compression levels suggest editing
        """
        try:
            img_array = np.array(image)
            
            # Analyze 8x8 DCT blocks (JPEG compression)
            block_variances = []
            
            for i in range(0, img_array.shape[0] - 8, 8):
                for j in range(0, img_array.shape[1] - 8, 8):
                    block = img_array[i:i+8, j:j+8]
                    if len(block.shape) == 3:
                        block = cv2.cvtColor(block, cv2.COLOR_RGB2GRAY)
                    
                    variance = np.var(block)
                    block_variances.append(variance)
            
            # Inconsistent variances suggest recompression
            variance_std = np.std(block_variances)
            compression_score = min(variance_std / 1000.0, 1.0)
            
            return {
                "found": compression_score > 0.65,
                "score": round(compression_score, 4),
                "details": "Inconsistent compression artifacts detected"
            }
            
        except Exception as e:
            return {
                "found": False,
                "score": 0.0,
                "error": str(e)
            }

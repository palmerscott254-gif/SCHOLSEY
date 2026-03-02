import numpy as np
from PIL import Image
import io
import cv2
from typing import Dict
import os

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
        self.analysis_size = int(os.getenv("EDIT_ANALYSIS_SIZE", "768"))
    
    async def load_model(self):
        """Initialize edit detection models"""
        print("✅ Edit Detector initialized")
    
    async def analyze(self, image_data: bytes) -> Dict:
        """
        Analyze image for signs of manipulation
        """
        try:
            image = Image.open(io.BytesIO(image_data))
            if max(image.size) > self.analysis_size:
                image.thumbnail((self.analysis_size, self.analysis_size), Image.Resampling.LANCZOS)
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
            original = Image.open(io.BytesIO(image_data)).convert('RGB')
            
            # Re-save at 95% quality
            temp_buffer = io.BytesIO()
            original.save(temp_buffer, format='JPEG', quality=95)
            temp_buffer.seek(0)
            resaved = Image.open(temp_buffer)
            
            # Calculate difference
            diff = np.array(original, dtype=np.float32) - np.array(resaved, dtype=np.float32)
            ela_image = np.abs(diff).astype(np.uint8)
            
            # Calculate ELA score
            ela_score = np.mean(ela_image) / 255.0
            
            # High ELA score in specific regions suggests editing
            region = 40
            h, w = ela_image.shape[:2]
            h_trim = (h // region) * region
            w_trim = (w // region) * region
            if h_trim > 0 and w_trim > 0:
                ela_gray = cv2.cvtColor(ela_image, cv2.COLOR_RGB2GRAY)
                tiles = ela_gray[:h_trim, :w_trim].reshape(h_trim // region, region, w_trim // region, region)
                max_regional_score = float(tiles.mean(axis=(1, 3)).max()) / 255.0
            else:
                max_regional_score = ela_score
            
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
            
            # Detect keypoints (ORB is faster and widely available)
            orb = cv2.ORB_create(nfeatures=1200)
            keypoints, descriptors = orb.detectAndCompute(gray, None)
            
            if descriptors is None or len(descriptors) < 10:
                return {
                    "found": False,
                    "score": 0.0,
                    "regions": 0
                }
            
            # Match features to find duplicates
            bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
            matches = bf.knnMatch(descriptors, descriptors, k=3)
            
            # Find self-matches (excluding exact same point)
            clone_matches = []
            for match in matches:
                if len(match) >= 2:
                    m, n = match[0], match[1]
                    if m.distance < 0.75 * n.distance and m.trainIdx != m.queryIdx:
                        clone_matches.append(m)
            
            clone_score = min(len(clone_matches) / 120.0, 1.0)
            
            return {
                "found": len(clone_matches) > 25,
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

            if len(img_array.shape) == 3:
                gray_all = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray_all = img_array
            
            lighting_vectors = []
            
            for i in range(0, h - region_size, region_size):
                for j in range(0, w - region_size, region_size):
                    gray_region = gray_all[i:i+region_size, j:j+region_size]
                    
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
            
            inconsistency_score = min((std_x + std_y) / 70.0, 1.0)
            
            return {
                "found": inconsistency_score > 0.55,
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
            gray = np.array(image.convert('L'), dtype=np.float32)

            # Analyze 8x8 block variance map in vectorized form
            block = 8
            h, w = gray.shape
            h_trim = (h // block) * block
            w_trim = (w // block) * block
            if h_trim == 0 or w_trim == 0:
                return {
                    "found": False,
                    "score": 0.0,
                    "details": "Image too small for compression analysis"
                }

            blocks = gray[:h_trim, :w_trim].reshape(h_trim // block, block, w_trim // block, block)
            block_variances = blocks.var(axis=(1, 3))

            # Inconsistent variances suggest recompression
            variance_std = float(np.std(block_variances))
            compression_score = min(variance_std / 600.0, 1.0)
            
            return {
                "found": compression_score > 0.6,
                "score": round(compression_score, 4),
                "details": "Inconsistent compression artifacts detected"
            }
            
        except Exception as e:
            return {
                "found": False,
                "score": 0.0,
                "error": str(e)
            }

from PIL import Image
import exifread
import io
from typing import Dict, List
from datetime import datetime

class MetadataAnalyzer:
    """
    Analyzes image metadata (EXIF, XMP, etc.) for anomalies
    - Inconsistent timestamps
    - Missing expected metadata
    - Software tags indicating editing
    - GPS inconsistencies
    """
    
    def __init__(self):
        pass
    
    async def analyze(self, image_data: bytes) -> Dict:
        """
        Analyze image metadata for anomalies
        """
        try:
            image = Image.open(io.BytesIO(image_data))
            
            # Extract EXIF data
            exif_data = self._extract_exif(io.BytesIO(image_data))
            
            # Check for anomalies
            issues = []
            anomaly_score = 0.0
            
            # Check for editing software
            software_check = self._check_software_tags(exif_data)
            if software_check["found"]:
                issues.extend(software_check["issues"])
                anomaly_score += 0.3
            
            # Check timestamp consistency
            timestamp_check = self._check_timestamps(exif_data)
            if timestamp_check["found"]:
                issues.extend(timestamp_check["issues"])
                anomaly_score += 0.2
            
            # Check GPS consistency
            gps_check = self._check_gps_consistency(exif_data)
            if gps_check["found"]:
                issues.extend(gps_check["issues"])
                anomaly_score += 0.3
            
            # Check for missing metadata
            missing_check = self._check_missing_metadata(exif_data)
            if missing_check["found"]:
                issues.extend(missing_check["issues"])
                anomaly_score += 0.2
            
            return {
                "found": bool(len(issues) > 0),
                "anomaly_score": float(min(anomaly_score, 1.0)),
                "issues": issues,
                "exif_data": self._format_exif_data(exif_data),
                "details": {
                    "software_anomalies": software_check,
                    "timestamp_anomalies": timestamp_check,
                    "gps_anomalies": gps_check,
                    "missing_metadata": missing_check,
                }
            }
            
        except Exception as e:
            print(f"❌ Metadata analysis failed: {e}")
            return {
                "found": False,
                "anomaly_score": 0.0,
                "issues": [],
                "error": str(e)
            }
    
    def _extract_exif(self, image_data) -> Dict:
        """Extract EXIF data from image"""
        try:
            tags = exifread.process_file(image_data)
            return {str(key): str(tags[key]) for key in tags.keys()}
        except:
            return {}
    
    def _check_software_tags(self, exif_data: Dict) -> Dict:
        """Check for software tags indicating editing"""
        editing_software = [
            'photoshop', 'gimp', 'lightroom', 'snapseed', 'vsco',
            'facetune', 'pixlr', 'affinity', 'darktable'
        ]
        
        issues = []
        found = False
        
        software_tag = exif_data.get('Image Software', '').lower()
        processing_tag = exif_data.get('Image ProcessingSoftware', '').lower()
        
        for software in editing_software:
            if software in software_tag or software in processing_tag:
                issues.append(f"Software tag shows {software.title()} use")
                found = True
        
        return {
            "found": found,
            "issues": issues,
            "software": software_tag or processing_tag or "Unknown"
        }
    
    def _check_timestamps(self, exif_data: Dict) -> Dict:
        """Check for timestamp inconsistencies"""
        issues = []
        found = False
        
        try:
            date_time = exif_data.get('EXIF DateTimeOriginal')
            date_time_digitized = exif_data.get('EXIF DateTimeDigitized')
            date_time_modified = exif_data.get('Image DateTime')
            
            timestamps = []
            if date_time:
                timestamps.append(('Original', date_time))
            if date_time_digitized:
                timestamps.append(('Digitized', date_time_digitized))
            if date_time_modified:
                timestamps.append(('Modified', date_time_modified))
            
            # Check if timestamps are suspiciously different
            if len(timestamps) >= 2:
                # Parse timestamps (simplified)
                times = []
                for label, ts in timestamps:
                    try:
                        # EXIF format: "YYYY:MM:DD HH:MM:SS"
                        dt = datetime.strptime(ts.split()[0], "%Y:%m:%d")
                        times.append((label, dt))
                    except:
                        pass
                
                if len(times) >= 2:
                    # Check difference
                    for i in range(len(times)-1):
                        diff_days = abs((times[i+1][1] - times[i][1]).days)
                        if diff_days > 30:
                            issues.append(
                                f"{times[i][0]} and {times[i+1][0]} timestamps differ by {diff_days} days"
                            )
                            found = True
            
            # Check if timestamp is in future
            if date_time:
                try:
                    dt = datetime.strptime(date_time.split()[0], "%Y:%m:%d")
                    if dt > datetime.now():
                        issues.append("Image timestamp is in the future")
                        found = True
                except:
                    pass
                    
        except Exception as e:
            pass
        
        return {
            "found": found,
            "issues": issues
        }
    
    def _check_gps_consistency(self, exif_data: Dict) -> Dict:
        """Check GPS data consistency"""
        issues = []
        found = False
        
        try:
            gps_lat = exif_data.get('GPS GPSLatitude')
            gps_lon = exif_data.get('GPS GPSLongitude')
            gps_time = exif_data.get('GPS GPSTimeStamp')
            gps_date = exif_data.get('GPS GPSDateStamp')
            
            if gps_lat and gps_lon:
                # Check if GPS time differs significantly from image time
                image_time = exif_data.get('EXIF DateTimeOriginal')
                
                if gps_date and gps_time and image_time:
                    # Simplified check
                    if gps_date not in image_time:
                        issues.append("GPS date doesn't match EXIF timestamp")
                        found = True
            
            # Check for GPS data without timestamp (suspicious)
            if (gps_lat or gps_lon) and not gps_time:
                issues.append("GPS coordinates present but timestamp missing")
                found = True
                
        except Exception as e:
            pass
        
        return {
            "found": found,
            "issues": issues
        }
    
    def _check_missing_metadata(self, exif_data: Dict) -> Dict:
        """Check for suspiciously missing metadata"""
        issues = []
        found = False
        
        # Expected tags for a typical photo
        expected_tags = [
            'Image Make',
            'Image Model',
            'EXIF DateTimeOriginal',
            'EXIF ExposureTime',
            'EXIF FNumber',
        ]
        
        missing_count = 0
        for tag in expected_tags:
            if tag not in exif_data:
                missing_count += 1
        
        if missing_count >= 3:
            issues.append(f"{missing_count} expected metadata fields are missing")
            found = True
        
        # Check if metadata was stripped
        if len(exif_data) < 10:
            issues.append("Metadata appears to have been stripped or is minimal")
            found = True
        
        return {
            "found": found,
            "issues": issues,
            "total_tags": len(exif_data)
        }
    
    def _format_exif_data(self, exif_data: Dict) -> Dict:
        """Format EXIF data for output"""
        return {
            "camera_make": exif_data.get('Image Make', 'Unknown'),
            "camera_model": exif_data.get('Image Model', 'Unknown'),
            "software": exif_data.get('Image Software', 'Unknown'),
            "date_time": exif_data.get('EXIF DateTimeOriginal', 'Unknown'),
            "total_tags": len(exif_data)
        }

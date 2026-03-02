from pydantic import BaseModel, ConfigDict
from typing import Dict, List, Optional

class AnalysisResult(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    is_ai_generated: bool
    ai_probability: float
    is_edited: bool
    edit_probability: float
    authenticity_score: float
    confidence_level: str
    
    metadata_anomalies: Dict
    lighting_inconsistencies: Dict
    compression_artifacts: Dict
    
    explanation: str
    detailed_report: Dict
    
    processing_time_ms: int
    model_version: str

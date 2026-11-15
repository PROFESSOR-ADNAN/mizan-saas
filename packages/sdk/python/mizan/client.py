"""
Mizan Official Python Client SDK
Sales & Billing Ingestion Engine for Ethiopian Retailers
"""

import requests
import datetime
from typing import List, Dict, Any, Optional

class MizanClient:
    def __init__(self, api_key: str, base_url: str = "https://mizan-api-3lif.onrender.com"):
        if not api_key:
            raise ValueError("Mizan API key is required")
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")

    def ingest_events(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Ingest a batch of transactions into Mizan in real-time.
        Amounts must be in Ethiopian Santim (1 ETB = 100 santims).
        """
        url = f"{self.base_url}/ingest/v1/events"
        headers = {
            "Content-Type": "application/json",
            "X-Mizan-Key": self.api_key,
        }
        res = requests.post(url, json={"events": events}, headers=headers, timeout=10)
        res.raise_for_status()
        return res.json()

    @staticmethod
    def etb_to_santim(amount_etb: float) -> int:
        """Converts ETB float to exact 64-bit integer santim."""
        return int(round(amount_etb * 100))

    @staticmethod
    def santim_to_etb(amount_santim: int) -> float:
        """Converts santim integer to ETB float."""
        return amount_santim / 100.0

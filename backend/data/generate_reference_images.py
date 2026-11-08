"""
Reference Image Generator & Perceptual Hashing Tool
Generates sample reference images for known debunked & verified media and records their pHash signatures.
"""

import os
import json
from PIL import Image, ImageDraw, ImageFont
import imagehash

def generate_reference_library():
    ref_dir = os.path.join(os.path.dirname(__file__), "..", "data", "reference_images")
    os.makedirs(ref_dir, exist_ok=True)
    
    reference_items = [
        {
            "id": "ref-001",
            "filename": "jwst_deep_field.png",
            "title": "NASA James Webb JADES-GS-z14-0 Spectroscopic Capture",
            "category": "Science / Verified",
            "authenticity_status": "authentic",
            "notes": "Authentic release imagery from STScI/NASA.",
            "color": (20, 24, 82),
            "text": "NASA / ESA JWST\nJADES-GS-z14-0\nConfirmed z=14.32"
        },
        {
            "id": "ref-002",
            "filename": "boiled_garlic_cure_hoax.png",
            "title": "Viral WhatsApp Forward: Boiled Garlic Cures Coronavirus",
            "category": "Health / Hoax",
            "authenticity_status": "debunked_hoax",
            "notes": "Widely forwarded viral infographic with falsified Chinese medical board badge.",
            "color": (160, 40, 40),
            "text": "VIRAL FORWARD:\nBoiled Garlic 24hr Cure\n100% Guaranteed Recovery"
        },
        {
            "id": "ref-003",
            "filename": "antarctic_pyramid_fake.png",
            "title": "Manipulated Satellite Photo of Antarctic Nunatak",
            "category": "Conspiracy / Manipulated",
            "authenticity_status": "manipulated",
            "notes": "Airbrushed contrast to artificially sharpen natural mountain ridges into stepped pyramid.",
            "color": (60, 90, 140),
            "text": "ANTARCTIC SATELLITE\nANOMALY - PYRAMID\nCLASSIFIED ARCHIVE"
        },
        {
            "id": "ref-004",
            "filename": "5g_birds_falling_misattributed.png",
            "title": "Misattributed Rome Starling Mortality Event",
            "category": "Misleading / Recycled Media",
            "authenticity_status": "recycled_out_of_context",
            "notes": "Photograph from Rome fireworks tragedy misattributed to 5G tests in India.",
            "color": (70, 70, 70),
            "text": "MASS BIRD EVENT\nROME NEW YEAR 2020\n(Falsely tagged 5G)"
        },
        {
            "id": "ref-005",
            "filename": "chandrayaan3_touchdown.png",
            "title": "ISRO Chandrayaan-3 Vikram Lander Thermal Cam",
            "category": "Science / Verified",
            "authenticity_status": "authentic",
            "notes": "Official telemetry and descent imager frame from ISRO MOX-ISTRAC.",
            "color": (230, 138, 0),
            "text": "ISRO MOX-ISTRAC\nCHANDRAYAAN-3 TOUCHDOWN\n69.37S 32.35E"
        }
    ]
    
    hash_registry = []
    
    for item in reference_items:
        img_path = os.path.join(ref_dir, item["filename"])
        
        # Create image with PIL
        img = Image.new('RGB', (400, 300), color=item["color"])
        draw = ImageDraw.Draw(img)
        
        # Add decorative framing
        draw.rectangle([(10, 10), (390, 290)], outline=(255, 255, 255), width=2)
        draw.text((25, 40), item["text"], fill=(255, 255, 255))
        draw.text((25, 230), f"VERIFAI ARCHIVE: {item['id']}", fill=(200, 200, 200))
        draw.text((25, 250), f"STATUS: {item['authenticity_status'].upper()}", fill=(240, 220, 100))
        
        img.save(img_path)
        
        # Compute hashes
        phash_val = str(imagehash.phash(img))
        dhash_val = str(imagehash.dhash(img))
        ahash_val = str(imagehash.average_hash(img))
        
        hash_registry.append({
            "id": item["id"],
            "filename": item["filename"],
            "title": item["title"],
            "category": item["category"],
            "authenticity_status": item["authenticity_status"],
            "notes": item["notes"],
            "phash": phash_val,
            "dhash": dhash_val,
            "ahash": ahash_val
        })
        print(f"[Reference Library] Generated {item['filename']} -> pHash: {phash_val}")
        
    index_path = os.path.join(ref_dir, "reference_hashes.json")
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(hash_registry, f, indent=2)
        
    print(f"[Reference Library] Successfully registered {len(hash_registry)} images in {index_path}")
    return index_path

if __name__ == "__main__":
    generate_reference_library()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from fastapi.responses import Response, JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import base64
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# WHITELIST - Only these emails can access the app
ALLOWED_EMAILS = [
    "vedevpered@gmail.com",
    "vedevpered.andrey@gmail.com"
]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ========== AUTH MODELS ==========

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SessionData(BaseModel):
    session_id: str

# ========== AUTH HELPERS ==========

async def get_current_user(request: Request) -> Optional[User]:
    """Get current user from session token cookie or Authorization header"""
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        return None
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        return None
    
    # Check expiry
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        return None
    
    return User(**user)

# ========== AUTH ENDPOINTS ==========

@api_router.post("/auth/session")
async def create_session(data: SessionData):
    """Exchange session_id for session_token after Google OAuth"""
    try:
        # Get user data from Emergent Auth
        async with httpx.AsyncClient() as client_http:
            response = await client_http.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": data.session_id}
            )
            if response.status_code != 200:
                logger.error(f"Emergent Auth rejected session: {response.status_code}")
                raise HTTPException(status_code=401, detail="Invalid session")
            
            user_data = response.json()
        
        email = user_data.get("email", "").lower()
        logger.info(f"Auth attempt for email: {email}")
        
        # Check whitelist
        if email not in [e.lower() for e in ALLOWED_EMAILS]:
            logger.warning(f"Access denied for email: {email}")
            return JSONResponse(
                status_code=403,
                content={"detail": "access_denied", "email": email}
            )
        
        # Create or update user
        existing_user = await db.users.find_one({"email": email}, {"_id": 0})
        if existing_user:
            user_id = existing_user["user_id"]
            await db.users.update_one(
                {"email": email},
                {"$set": {
                    "name": user_data.get("name", ""),
                    "picture": user_data.get("picture", "")
                }}
            )
        else:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            await db.users.insert_one({
                "user_id": user_id,
                "email": email,
                "name": user_data.get("name", ""),
                "picture": user_data.get("picture", ""),
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        # Create session with unique token
        import secrets
        session_token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=30)  # Extended to 30 days
        
        # Delete old sessions for this user
        await db.user_sessions.delete_many({"user_id": user_id})
        
        await db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        
        # Return user data with session_token for client storage
        return JSONResponse(content={
            **user,
            "session_token": session_token
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Auth error: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current user data"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request):
    """Logout and clear session"""
    # Try to get token from cookie or header
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie(key="session_token", path="/")
    return response

# ========== MODELS ==========

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    price_per_kg: float
    consumption_kg_m2: float  # расход кг/м²
    description: Optional[str] = ""

class ProductCreate(BaseModel):
    name: str
    price_per_kg: float
    consumption_kg_m2: float
    description: Optional[str] = ""

class Calculation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    product_name: str
    client_name: Optional[str] = ""
    order_date: Optional[str] = ""
    order_source: Optional[str] = ""
    area_m2: float
    layers: int
    consumption_kg_m2: float
    total_kg: float
    price_per_kg: float
    total_price: float
    with_primer: bool = False
    lac_type: Optional[str] = None
    items: Optional[List[dict]] = None
    include_in_total: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CalculationCreate(BaseModel):
    product_id: str
    product_name: str
    client_name: Optional[str] = ""
    order_date: Optional[str] = ""
    order_source: Optional[str] = ""
    area_m2: float
    layers: int
    consumption_kg_m2: float
    total_kg: float
    price_per_kg: float
    total_price: float
    with_primer: bool = False
    lac_type: Optional[str] = None
    items: Optional[List[dict]] = None
    include_in_total: bool = True

class Document(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    doc_type: str  # commercial_proposal, technical_description
    calculation_id: Optional[str] = None
    content: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DocumentCreate(BaseModel):
    title: str
    doc_type: str
    calculation_id: Optional[str] = None
    content: str

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "main_settings"
    currency: str = "RUB"
    unit: str = "m2"
    company_name: str = "PoliBest 911"

class SettingsUpdate(BaseModel):
    currency: Optional[str] = None
    unit: Optional[str] = None
    company_name: Optional[str] = None

class CalculatorPrices(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "calculator_prices"
    primer: float = 720
    paint: float = 990
    enamel: float = 1260
    floki: float = 1350
    lacGlossy: float = 1440
    lacMatte: float = 1800

class CalculatorPricesUpdate(BaseModel):
    primer: Optional[float] = None
    paint: Optional[float] = None
    enamel: Optional[float] = None
    floki: Optional[float] = None
    lacGlossy: Optional[float] = None
    lacMatte: Optional[float] = None

class Instruction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    category: str
    content: str = ""
    file_name: Optional[str] = None
    file_data: Optional[str] = None  # base64 encoded file
    file_type: str = "text"  # text, pdf, image
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class InstructionCreate(BaseModel):
    title: str
    category: str
    content: str = ""
    file_name: Optional[str] = None
    file_data: Optional[str] = None
    file_type: str = "text"

# KP Statuses
KP_STATUSES = ["draft", "sent", "paid", "cancelled"]
KP_STATUS_LABELS = {
    "draft": "Чернетка",
    "sent": "Відправлено", 
    "paid": "Оплачено",
    "cancelled": "Скасовано"
}

# KP (Commercial Proposal) Models
class KPMaterial(BaseModel):
    id: int
    name: str
    consumption: float
    price: float

class KPRoom(BaseModel):
    id: int
    name: str
    area: float
    layers: Optional[int] = None  # Auto-calculated from materials consumption
    materials: List[KPMaterial]
    totals: Optional[dict] = None

class KPSettings(BaseModel):
    currency: str = "UAH"
    includeVat: bool = True
    vatRate: float = 20
    dealerDiscount: float = 0
    productionTime: str = ""
    warranty: str = ""

class KPSignature(BaseModel):
    position: str = ""
    name: str = ""
    phone: str = ""
    email: str = ""

class KPCompany(BaseModel):
    name: str = "ТОВ «ВедеВперед»"
    address: str = ""
    edrpou: str = ""
    iban: str = ""
    bank: str = ""
    pdv: str = ""
    ipn: str = ""
    phones: str = ""

class KPAdditionalData(BaseModel):
    description: str = ""
    advantages: List[str] = []
    techParams: List[dict] = []
    company: Optional[KPCompany] = None
    signature: KPSignature = KPSignature()

class KPCreate(BaseModel):
    title: str
    client: str
    location: str = ""
    date: str
    settings: KPSettings
    rooms: List[KPRoom]
    additionalData: KPAdditionalData
    grandTotal: float
    status: str = "draft"

class KP(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    client: str
    location: str = ""
    date: str
    settings: dict
    rooms: List[dict]
    additionalData: dict
    grandTotal: float
    status: str = "draft"
    status_history: List[dict] = []
    doc_type: str = "kp"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ========== ROUTES ==========

@api_router.get("/")
async def root():
    return {"message": "PoliBest 911 API"}

# Products
@api_router.get("/products", response_model=List[Product])
async def get_products():
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    return products

@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate):
    product_obj = Product(**product.model_dump())
    doc = product_obj.model_dump()
    await db.products.insert_one(doc)
    return product_obj

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product: ProductCreate):
    result = await db.products.find_one_and_update(
        {"id": product_id},
        {"$set": product.model_dump()},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Продукт не найден")
    del result["_id"]
    return result

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Продукт не найден")
    return {"message": "Продукт удалён"}

# Calculations
@api_router.get("/calculations", response_model=List[Calculation])
async def get_calculations():
    calculations = await db.calculations.find({}, {"_id": 0}).to_list(1000)
    return calculations

@api_router.post("/calculations", response_model=Calculation)
async def create_calculation(calc: CalculationCreate):
    calc_obj = Calculation(**calc.model_dump())
    doc = calc_obj.model_dump()
    await db.calculations.insert_one(doc)
    return calc_obj

@api_router.get("/calculations/{calc_id}", response_model=Calculation)
async def get_calculation(calc_id: str):
    calc = await db.calculations.find_one({"id": calc_id}, {"_id": 0})
    if not calc:
        raise HTTPException(status_code=404, detail="Розрахунок не знайдено")
    return calc

@api_router.patch("/calculations/{calc_id}/toggle-total")
async def toggle_calculation_total(calc_id: str):
    calc = await db.calculations.find_one({"id": calc_id})
    if not calc:
        raise HTTPException(status_code=404, detail="Розрахунок не знайдено")
    
    current_value = calc.get("include_in_total", True)
    await db.calculations.update_one(
        {"id": calc_id},
        {"$set": {"include_in_total": not current_value}}
    )
    return {"include_in_total": not current_value}

class CalculationUpdate(BaseModel):
    client_name: Optional[str] = None
    order_date: Optional[str] = None
    order_source: Optional[str] = None

@api_router.patch("/calculations/{calc_id}")
async def update_calculation(calc_id: str, update: CalculationUpdate):
    calc = await db.calculations.find_one({"id": calc_id})
    if not calc:
        raise HTTPException(status_code=404, detail="Розрахунок не знайдено")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.calculations.update_one(
            {"id": calc_id},
            {"$set": update_data}
        )
    
    updated = await db.calculations.find_one({"id": calc_id}, {"_id": 0})
    return updated

@api_router.delete("/calculations/{calc_id}")
async def delete_calculation(calc_id: str):
    result = await db.calculations.delete_one({"id": calc_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Розрахунок не знайдено")
    return {"message": "Розрахунок видалено"}

# Documents
@api_router.get("/documents", response_model=List[Document])
async def get_documents():
    documents = await db.documents.find({}, {"_id": 0}).to_list(1000)
    return documents

@api_router.post("/documents", response_model=Document)
async def create_document(doc: DocumentCreate):
    doc_obj = Document(**doc.model_dump())
    doc_dict = doc_obj.model_dump()
    await db.documents.insert_one(doc_dict)
    return doc_obj

@api_router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    result = await db.documents.delete_one({"id": doc_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Документ не найден")
    return {"message": "Документ удалён"}

# Get document as downloadable file
@api_router.get("/documents/{doc_id}/file")
async def get_document_file(doc_id: str):
    doc = await db.documents.find_one({"id": doc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Документ не знайдено")
    
    content = doc.get("content", "")
    title = doc.get("title", "document")
    
    # Encode filename for Content-Disposition header (RFC 5987)
    import urllib.parse
    encoded_filename = urllib.parse.quote(f"{title}.txt")
    
    # Return as text file
    return Response(
        content=content.encode("utf-8"),
        media_type="text/plain; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

# ========== KP (Commercial Proposals) ==========

@api_router.get("/kp")
async def get_all_kp():
    """Get all commercial proposals"""
    kps = await db.kp.find({}, {"_id": 0}).to_list(1000)
    return kps

@api_router.get("/kp/{kp_id}")
async def get_kp(kp_id: str):
    """Get single KP by ID"""
    kp = await db.kp.find_one({"id": kp_id}, {"_id": 0})
    if not kp:
        raise HTTPException(status_code=404, detail="КП не знайдено")
    return kp

@api_router.post("/kp")
async def create_kp(kp_data: KPCreate):
    """Create new commercial proposal"""
    kp_obj = KP(
        title=kp_data.title,
        client=kp_data.client,
        location=kp_data.location,
        date=kp_data.date,
        settings=kp_data.settings.model_dump(),
        rooms=[r.model_dump() for r in kp_data.rooms],
        additionalData=kp_data.additionalData.model_dump(),
        grandTotal=kp_data.grandTotal
    )
    doc = kp_obj.model_dump()
    await db.kp.insert_one(doc)
    return {"id": kp_obj.id, "message": "КП створено"}

@api_router.put("/kp/{kp_id}")
async def update_kp(kp_id: str, kp_data: KPCreate):
    """Update existing KP"""
    existing = await db.kp.find_one({"id": kp_id})
    if not existing:
        raise HTTPException(status_code=404, detail="КП не знайдено")
    
    update_data = {
        "title": kp_data.title,
        "client": kp_data.client,
        "location": kp_data.location,
        "date": kp_data.date,
        "settings": kp_data.settings.model_dump(),
        "rooms": [r.model_dump() for r in kp_data.rooms],
        "additionalData": kp_data.additionalData.model_dump(),
        "grandTotal": kp_data.grandTotal
    }
    
    await db.kp.update_one({"id": kp_id}, {"$set": update_data})
    return {"id": kp_id, "message": "КП оновлено"}

@api_router.delete("/kp/{kp_id}")
async def delete_kp(kp_id: str):
    """Delete KP"""
    result = await db.kp.delete_one({"id": kp_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="КП не знайдено")
    return {"message": "КП видалено"}

class KPStatusUpdate(BaseModel):
    status: str

@api_router.patch("/kp/{kp_id}/status")
async def update_kp_status(kp_id: str, update: KPStatusUpdate):
    """Update KP status"""
    if update.status not in KP_STATUSES:
        raise HTTPException(status_code=400, detail=f"Невірний статус. Дозволені: {KP_STATUSES}")
    
    existing = await db.kp.find_one({"id": kp_id})
    if not existing:
        raise HTTPException(status_code=404, detail="КП не знайдено")
    
    old_status = existing.get("status", "draft")
    
    # Add to status history
    history_entry = {
        "from_status": old_status,
        "to_status": update.status,
        "changed_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.kp.update_one(
        {"id": kp_id},
        {
            "$set": {"status": update.status},
            "$push": {"status_history": history_entry}
        }
    )
    
    return {
        "id": kp_id,
        "status": update.status,
        "status_label": KP_STATUS_LABELS.get(update.status, update.status),
        "message": "Статус оновлено"
    }

@api_router.get("/kp/stats/funnel")
async def get_kp_funnel_stats():
    """Get KP funnel statistics"""
    pipeline = [
        {
            "$group": {
                "_id": {"$ifNull": ["$status", "draft"]},
                "count": {"$sum": 1},
                "total_sum": {"$sum": "$grandTotal"}
            }
        }
    ]
    
    results = await db.kp.aggregate(pipeline).to_list(100)
    
    # Build stats dict
    stats = {status: {"count": 0, "total_sum": 0} for status in KP_STATUSES}
    total_count = 0
    total_sum = 0
    
    for r in results:
        status = r["_id"]
        if status in stats:
            stats[status]["count"] = r["count"]
            stats[status]["total_sum"] = r["total_sum"]
            total_count += r["count"]
            total_sum += r["total_sum"]
    
    # Calculate conversion rates
    funnel = []
    prev_count = None
    for status in KP_STATUSES:
        if status == "cancelled":
            continue
        count = stats[status]["count"]
        conversion = 100 if prev_count is None else (count / prev_count * 100 if prev_count > 0 else 0)
        funnel.append({
            "status": status,
            "label": KP_STATUS_LABELS[status],
            "count": count,
            "total_sum": stats[status]["total_sum"],
            "conversion": round(conversion, 1)
        })
        prev_count = count if count > 0 else prev_count
    
    return {
        "funnel": funnel,
        "cancelled": stats["cancelled"],
        "total_count": total_count,
        "total_sum": total_sum,
        "status_labels": KP_STATUS_LABELS
    }

# Settings
@api_router.get("/settings", response_model=Settings)
async def get_settings():
    settings = await db.settings.find_one({"id": "main_settings"}, {"_id": 0})
    if not settings:
        default_settings = Settings()
        await db.settings.insert_one(default_settings.model_dump())
        return default_settings
    return settings

@api_router.put("/settings", response_model=Settings)
async def update_settings(settings: SettingsUpdate):
    update_data = {k: v for k, v in settings.model_dump().items() if v is not None}
    if update_data:
        await db.settings.update_one(
            {"id": "main_settings"},
            {"$set": update_data},
            upsert=True
        )
    result = await db.settings.find_one({"id": "main_settings"}, {"_id": 0})
    return result

# Calculator Prices
@api_router.get("/calculator-prices", response_model=CalculatorPrices)
async def get_calculator_prices():
    prices = await db.calculator_prices.find_one({"id": "calculator_prices"}, {"_id": 0})
    if not prices:
        default_prices = CalculatorPrices()
        await db.calculator_prices.insert_one(default_prices.model_dump())
        return default_prices
    return prices

@api_router.put("/calculator-prices", response_model=CalculatorPrices)
async def update_calculator_prices(prices: CalculatorPricesUpdate):
    update_data = {k: v for k, v in prices.model_dump().items() if v is not None}
    if update_data:
        await db.calculator_prices.update_one(
            {"id": "calculator_prices"},
            {"$set": update_data},
            upsert=True
        )
    result = await db.calculator_prices.find_one({"id": "calculator_prices"}, {"_id": 0})
    if not result:
        default_prices = CalculatorPrices()
        await db.calculator_prices.insert_one(default_prices.model_dump())
        return default_prices
    return result

# Instructions
@api_router.get("/instructions", response_model=List[Instruction])
async def get_instructions():
    instructions = await db.instructions.find({}, {"_id": 0}).to_list(1000)
    return instructions

@api_router.post("/instructions", response_model=Instruction)
async def create_instruction(instruction: InstructionCreate):
    instr_obj = Instruction(**instruction.model_dump())
    doc = instr_obj.model_dump()
    await db.instructions.insert_one(doc)
    return instr_obj

@api_router.put("/instructions/{instruction_id}", response_model=Instruction)
async def update_instruction(instruction_id: str, instruction: InstructionCreate):
    result = await db.instructions.find_one_and_update(
        {"id": instruction_id},
        {"$set": instruction.model_dump()},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Инструкция не найдена")
    del result["_id"]
    return result

@api_router.delete("/instructions/{instruction_id}")
async def delete_instruction(instruction_id: str):
    result = await db.instructions.delete_one({"id": instruction_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Инструкция не найдена")
    return {"message": "Инструкция удалена"}

# Get instruction file for download/sharing
@api_router.get("/instructions/{instruction_id}/file")
async def get_instruction_file(instruction_id: str):
    instruction = await db.instructions.find_one({"id": instruction_id}, {"_id": 0})
    if not instruction:
        raise HTTPException(status_code=404, detail="Інструкція не знайдена")
    
    if not instruction.get("file_data"):
        raise HTTPException(status_code=404, detail="Файл не знайдено")
    
    # Parse base64 data
    file_data = instruction["file_data"]
    if "," in file_data:
        # Format: data:mime/type;base64,xxxxx
        header, base64_data = file_data.split(",", 1)
        mime_type = header.split(":")[1].split(";")[0] if ":" in header else "application/octet-stream"
    else:
        base64_data = file_data
        mime_type = "application/octet-stream"
    
    # Decode base64
    try:
        file_bytes = base64.b64decode(base64_data)
    except Exception:
        raise HTTPException(status_code=500, detail="Помилка декодування файлу")
    
    file_name = instruction.get("file_name", f"{instruction['title']}.bin")
    
    # Encode filename for Content-Disposition header (RFC 5987)
    import urllib.parse
    encoded_filename = urllib.parse.quote(file_name)
    
    return Response(
        content=file_bytes,
        media_type=mime_type,
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

# Dashboard stats
@api_router.get("/stats")
async def get_stats():
    products_count = await db.products.count_documents({})
    calculations_count = await db.calculations.count_documents({})
    documents_count = await db.documents.count_documents({})
    
    # Filter for included calculations
    included_filter = {"$or": [
        {"include_in_total": True},
        {"include_in_total": {"$exists": False}},
        {"include_in_total": None}
    ]}
    
    # Get recent calculations (only included ones)
    recent_calcs = await db.calculations.find(included_filter, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    # Count only included calculations
    included_count = await db.calculations.count_documents(included_filter)
    
    # Calculate total revenue only from included calculations
    pipeline = [
        {"$match": included_filter},
        {"$group": {"_id": None, "total": {"$sum": "$total_price"}}}
    ]
    total_result = await db.calculations.aggregate(pipeline).to_list(1)
    total_revenue = total_result[0]["total"] if total_result else 0
    
    return {
        "products_count": products_count,
        "calculations_count": included_count,
        "documents_count": documents_count,
        "total_revenue": total_revenue,
        "recent_calculations": recent_calcs
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

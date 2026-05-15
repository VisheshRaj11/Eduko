from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, plan, translate, speech, ocr
import uvicorn

app = FastAPI(
    title="Eduko AI Service",
    description="AI microservice powering Eduko's tutoring, plan generation, OCR, and speech features.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router,      prefix="/ai", tags=["Chat"])
app.include_router(plan.router,      prefix="/ai", tags=["Learning Plan"])
app.include_router(translate.router, prefix="/ai", tags=["Translation"])
app.include_router(speech.router,    prefix="/ai", tags=["Speech"])
app.include_router(ocr.router,       prefix="/ai", tags=["OCR"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "Eduko AI"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=4000, reload=True)

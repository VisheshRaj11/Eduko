import wave, io, logging
from dotenv import load_dotenv
load_dotenv()
from routers.speech import _transcribe_bytes

logging.basicConfig(level=logging.INFO)

bio = io.BytesIO()
with wave.open(bio, 'wb') as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(16000)
    f.writeframes(b'\x00' * 32000)

print("Transcription:", _transcribe_bytes(bio.getvalue(), 'audio/wav'))

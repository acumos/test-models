# ===============LICENSE_START=======================================================
# Acumos Apache-2.0
# ===================================================================================
# Copyright (C) 2017-2018 AT&T Intellectual Property & Tech Mahindra. All rights reserved.
# ===================================================================================
# This Acumos software file is distributed by AT&T and Tech Mahindra
# under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# This file is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ===============LICENSE_END=========================================================


import numpy


import speech_recognition as sr

# obtain path to "english.wav" in the same folder as this script
from os import path
AUDIO_FILE = path.join(path.dirname(path.realpath(__file__)), "male.wav")
# AUDIO_FILE = path.join(path.dirname(path.realpath(__file__)), "french.aiff")
# AUDIO_FILE = path.join(path.dirname(path.realpath(__file__)), "chinese.flac")

# use the audio file as the audio source
r = sr.Recognizer()
with sr.AudioFile(AUDIO_FILE) as source:
    audio = r.record(source)  # read the entire audio file

#Google
GOOGLE_CLOUD_SPEECH_CREDENTIALS = r"""
{
  "type": "service_account",
  "project_id": "api-project-578182755725",
  "private_key_id": "ffc999a196c6c0047e8330171ef74b119fa46cf2",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCg9tigo0xpx3FO\njlZtp82fm9QdXA256d9t8EcmfIX4JQW8w9ZuPYTwSw0F2KhwmU9gmxkBsvjUbOpn\nBkmyrsr8wiqnt8MRibD9Tm3DaDfdZV5LLKy51rPtwK8bHl5NucYLRgWLXNQlNUuj\nvM6iZMwCVfvma+HXjRvmgBLdkCg2shPBJpkJO2Ff+cgqkvtfRCVpdtoKrF7Gjuk0\nwpLLbw/Hk8fuDjR8gMM8aEIcr+URf16w8diosN4PkX9o6ccWrABTvyTEzqpYd4mk\nJEAdH8SWLCSPNQ/EgzshhEsEPtovWLtXbGmRs5EI5Tc6F1SUsx5uouOmzLJuswWJ\nNfcQ3YbbAgMBAAECggEAFHs0V0RQDcmd5kQARVWruVpnpBC5gmV6049WTlRb65Yy\nY7F7kG1tg/HYx1ypGiK30fAKP4gZV1ZAgTlwmTbah0zhhpPAU3P0vFaFau7Q5O/o\nDqKxm7fxDxiMb2Pu1e8Efxy6yd/W8qEUbdIxbMJsnwN32PrzMq021p6HR//2zfao\nySI9+5wISGoIrr6saJFOVeh8BLgE+piU+POGpT02hPWe9ymnrDmVPspuVTYK/R3e\nVGk55QpKa+S56l3rLLidA72gNY9cLKnvcB9hb4lk6iq6it0iyHo3enNcK4eBbCNv\nezZ2sP/CMz/XeOu2HYg+sxWO6D5YngOqHdCqnoOXuQKBgQDiuaJ7FJLCZ2Cir58D\nDf9iw/BVnnvKzPDniQ1OGZtIHgUJxS4ZY54ftg3W4SG4cZhb+qy31rzmLbV4V7a3\nyNtVh9ipykyoWUHhZx1FNdgS5RCNaz/P7sldClrY9Doq6SURN82IIOOl8AUUAAaK\nhGgRtL7BrT/mIsCCXpwy/oOq1wKBgQC1v369t+9yeW7HVTZ9g3huEF0q9YlWpmfG\nQGY7ADy3ij18CldoXt8YDBapgF8LhqwN+FFGkmZuYA8d54u7oRPgK+B3Az1Xjfzk\nMSb7bYhVJb6kchjfBY4nQbdBp0hojetZXWtujONYQ1TFqcYonAZGzHylbz4e1eaJ\nI1Tk+cEnnQKBgQDX292ySTghFsOOoJ5IDj+kDOD441cBEnYaOwYL4Z1R4CLz1mO5\nkHqvvmkWuGmebaidieB/d1eJ3uLznK8982G/4QKLRSwO7EwpCj938XezJZvIyN+M\nXNAiYQV1obDvweGkrvhkLswO5KIxFIUlxEJA+VDUnNpFhbi7ZtBYTLGXKQKBgGhz\nRUODEfmYEDI+prI7fFrEzMaDlgpWWA13tUjzOfHBYNSInPM+krgfOmbvf7AAFaFx\ntEP6nyOP0SA+ke+jAukyTi4Xjoli8JO0K9MTf+ZvasDXUbPaXXfyLH9uxA5SgY86\nQSOnlICFMZLnnxp3kKPfoULyS6EtDPCDfaaaYoeBAoGAam3dbv1DtAu1f4pylsSZ\ncte+yikzaAuauRgfFQsLEAWM5OKOITVYnGoMSqmIPCfRXfhreEeWZX2bbc8x9xyy\nHiqxs7pQ5tvomMx7CqjDSwwjZNAWExCu6WKLQVJwdAhna6BjR/7opaiqNaKZW+vd\nsQTk6YsWFPOPcVk6B5QHijE=\n-----END PRIVATE KEY-----\n",
  "client_email": "voice-api-sample@api-project-578182755725.iam.gserviceaccount.com",
  "client_id": "117602994543249654593",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://accounts.google.com/o/oauth2/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/voice-api-sample%40api-project-578182755725.iam.gserviceaccount.com"
}

"""
try:
    print("Google Cloud Speech thinks you said " + r.recognize_google_cloud(audio, credentials_json=GOOGLE_CLOUD_SPEECH_CREDENTIALS))
except sr.UnknownValueError:
    print("Google Cloud Speech could not understand audio")
except sr.RequestError as e:
    print("Could not request results from Google Cloud Speech service; {0}".format(e))
    
#CMU API
try:
    print("Sphinx thinks you said " + r.recognize_sphinx(audio))
except sr.UnknownValueError:
    print("Sphinx could not understand audio")
except sr.RequestError as e:
    print("Sphinx error; {0}".format(e))    

#Houndify
HOUNDIFY_CLIENT_ID = "ThQxRRrVuyf3COYlxyA1Qg=="  # Houndify client IDs are Base64-encoded strings
HOUNDIFY_CLIENT_KEY = "8z3NX__tLdaSJtWxarxpKc_Gv3Q_a7hfmE1PSsUQm12lPtqL2PejYgZtef1rqTo4E1AsiGeu8H7wWakjltgJ4g=="  # Houndify client keys are Base64-encoded strings
try:
    print("Houndify thinks you said " + r.recognize_houndify(audio, client_id=HOUNDIFY_CLIENT_ID, client_key=HOUNDIFY_CLIENT_KEY))
except sr.UnknownValueError:
    print("Houndify could not understand audio")
except sr.RequestError as e:
    print("Could not request results from Houndify service; {0}".format(e))    

    
    

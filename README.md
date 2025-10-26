# 🗓️ Turnero de Licencias

Sistema web de turnos en tiempo real, inspirado en los turneros bancarios, para la gestión y visualización de atención en boxes.  
El objetivo es permitir que los administradores gestionen turnos y boxes, y que el público vea en tiempo real qué turno se está atendiendo y cuáles ya pasaron.

---

## 🚀 Tecnologías utilizadas

**Backend**
- Node.js + Express  
- MongoDB (con usuarios y roles configurados)  
- Socket.io (para la comunicación en tiempo real)  

**Frontend**
- Vue 3 (Composition API)  
- TailwindCSS  
- Socket.io-client  

---

## 🧩 Arquitectura general

El sistema se divide en dos partes principales:

1. **Backend (API + WebSockets)**  
   Responsable de:
   - Gestionar los turnos y boxes.
   - Exponer endpoints REST.
   - Emitir y escuchar eventos en tiempo real con Socket.io.

2. **Frontend (Interfaz web)**  
   Se compone de dos vistas principales:
   - **Vista pública** → Muestra los turnos en pantalla (el actual, los anteriores, los perdidos, etc.).
   - **Vista admin** → Permite avanzar el turno, asignar boxes, y corregir datos manualmente.

---

## 📂 Estructura del proyecto


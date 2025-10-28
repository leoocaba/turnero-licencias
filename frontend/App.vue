<template>
  <div class="min-h-screen bg-gradient-to-b from-white to-gray-50">
    <nav class="bg-white border-b border-gray-100">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <!-- Logo: usa la clase .logo-circle que referencia las variables exactas -->
          <div class="logo-circle" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7.55 12 7.55 12S19.1 15.25 19.1 10C19.1 5.58 15.52 2 12 2z" fill="white"/>
              <circle cx="12" cy="9.5" r="2.5" fill="rgba(255,255,255,0.95)"/>
            </svg>
          </div>
          <div class="font-semibold text-gray-800">Turnero Licencias</div>
        </div>
        <div class="hidden sm:flex items-center gap-4">
          <a class="text-sm text-gray-600 hover:text-gray-800" href="#">Inicio</a>
          <a class="text-sm text-gray-600 hover:text-gray-800" href="#">Administrar</a>
        </div>
      </div>
    </nav>

    <main class="py-6">
      <router-view />
    </main>

    <ToastContainer />
  </div>
</template>

<script setup>
import ToastContainer from "./components/ToastContainer.vue";
// ...existing code...
</script>
<!-- ...existing code... -->
<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full" role="alertdialog" aria-modal="true">
          <div class="p-6">
            <h2 v-if="title" class="text-xl font-semibold mb-4">{{ title }}</h2>
            <p class="text-gray-700 mb-6">{{ message }}</p>
            <div class="flex justify-end">
              <button
                @click="onClose"
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
              >
                {{ closeText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  title: String,
  message: {
    type: String,
    required: true
  },
  closeText: {
    type: String,
    default: 'OK'
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const onClose = () => {
  emit('close')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
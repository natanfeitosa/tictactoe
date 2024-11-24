<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full" role="dialog" aria-modal="true">
          <div class="p-6">
            <h2 class="text-xl font-semibold mb-4" v-if="title">{{ title }}</h2>
            <p class="text-gray-700 mb-6">{{ message }}</p>
            <div class="flex justify-end space-x-4">
              <button
                @click="onCancel"
                class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                {{ cancelText }}
              </button>
              <button
                @click="onConfirm"
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
              >
                {{ confirmText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  title: String,
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: 'Confirmar'
  },
  cancelText: {
    type: String,
    default: 'Cancelar'
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const onConfirm = () => {
  emit('confirm')
  emit('update:modelValue', false)
}

const onCancel = () => {
  emit('cancel')
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
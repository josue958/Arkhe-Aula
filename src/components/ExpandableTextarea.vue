<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  maxLength?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

function resize() {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px'
  }
}

watch(() => props.modelValue, () => {
  nextTick(resize)
})

onMounted(() => {
  nextTick(resize)
})

function onInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
  nextTick(resize)
}
</script>

<template>
  <textarea
    ref="textareaRef"
    class="form-input expandable-textarea"
    :value="modelValue"
    :placeholder="placeholder"
    :maxlength="maxLength"
    @input="onInput"
    rows="1"
  ></textarea>
</template>

<style scoped>
.expandable-textarea {
  resize: none;
  overflow: hidden;
  min-height: 38px;
  line-height: 1.4;
  width: 100%;
  box-sizing: border-box;
}
</style>

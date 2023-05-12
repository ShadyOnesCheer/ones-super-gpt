<style scoped>
.header {
	width: 100%;
	height: 64px;
	display: flex;
	align-items: center;
	border-bottom: 1px solid #e5e7eb;
	justify-content: space-between;
	padding: 10px;
}
</style>

<template>
	<NLayoutHeader class="header">
		<div>GPT</div>
		<HoverButton @click="show = true">
      <span class="text-xl text-[#4f555e] dark:text-white">
        <SvgIcon icon="ri:settings-4-line"/>
      </span>
		</HoverButton>
	</NLayoutHeader>
	<Setting v-if="show" v-model:visible="show"/>

</template>

<script lang="ts" setup>
import {ref} from 'vue'
import {HoverButton, Setting, SvgIcon} from '@/components/common'

const show = ref(false)
</script>

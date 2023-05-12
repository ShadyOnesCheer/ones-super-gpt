<script lang='ts' setup>
import type {CSSProperties} from 'vue'
import {computed, ref, watch} from 'vue'
import {NButton, NLayoutSider} from 'naive-ui'
import List from './List.vue'
import {useAppStore, useChatStore} from '@/store'
import {useBasicLayout} from '@/hooks/useBasicLayout'

const appStore = useAppStore()
const chatStore = useChatStore()

const {isMobile} = useBasicLayout()
const show = ref(false)

const collapsed = computed(() => appStore.siderCollapsed)

function handleAdd() {
	chatStore.addHistory({title: 'New Chat', uuid: Date.now(), isEdit: false})
	if (isMobile.value)
		appStore.setSiderCollapsed(true)
}

function handleUpdateCollapsed() {
	appStore.setSiderCollapsed(!collapsed.value)
}

const getMobileClass = computed<CSSProperties>(() => {
	if (isMobile.value) {
		return {
			position: 'fixed',
			zIndex: 50,
		}
	}
	return {}
})

const mobileSafeArea = computed(() => {
	if (isMobile.value) {
		return {
			paddingBottom: 'env(safe-area-inset-bottom)',
		}
	}
	return {}
})

watch(
	isMobile,
	(val) => {
		appStore.setSiderCollapsed(val)
	},
	{
		immediate: true,
		flush: 'post',
	},
)
</script>

<template>
	<NLayoutSider
		:collapsed="collapsed"
		:collapsed-width="0"
		:show-trigger="isMobile ? false : 'arrow-circle'"
		:style="getMobileClass"
		:width="260"
		bordered
		collapse-mode="transform"
		position="absolute"
		@update-collapsed="handleUpdateCollapsed"
	>
		<div :style="mobileSafeArea" class="flex flex-col h-full">
			<main class="flex flex-col flex-1 min-h-0">
				<div class="p-4">
					<NButton block dashed @click="handleAdd">
						{{ $t('chat.newChatButton') }}
					</NButton>
				</div>
				<div class="flex-1 min-h-0 pb-4 overflow-hidden">
					<List/>
				</div>
			</main>
		</div>
	</NLayoutSider>
	<template v-if="isMobile">
		<div v-show="!collapsed" class="fixed inset-0 z-40 w-full h-full bg-black/40" @click="handleUpdateCollapsed"/>
	</template>
</template>

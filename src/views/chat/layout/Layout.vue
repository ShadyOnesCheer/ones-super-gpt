<script lang='ts' setup>
import {computed} from 'vue'
import {NLayout, NLayoutContent} from 'naive-ui'
import {useRouter} from 'vue-router'
import Sider from './sider/index.vue'
import Header from './header/index.vue'
import Permission from './Permission.vue'
import {useBasicLayout} from '@/hooks/useBasicLayout'
import {useAppStore, useAuthStore, useChatStore} from '@/store'

const router = useRouter()
const appStore = useAppStore()
const chatStore = useChatStore()
const authStore = useAuthStore()

router.replace({name: 'Chat', params: {uuid: chatStore.active}})

const {isMobile} = useBasicLayout()

const collapsed = computed(() => appStore.siderCollapsed)

const needPermission = computed(() => !!authStore.session?.auth && !authStore.token)

const getMobileClass = computed(() => {
	if (isMobile.value)
		return ['rounded-none', 'shadow-none']
	return ['shadow-md', 'dark:border-neutral-800']
})

const getContainerClass = computed(() => {
	return [
		{'pl-[260px]': !isMobile.value && !collapsed.value},
	]
})
</script>

<template>
	<div class="h-full w-full dark:bg-[#24272e] transition-all">
		<div :class="getMobileClass" class="h-full overflow-hidden">
			<NLayout class="h-full">
				<Header/>
				<NLayout :class="getContainerClass" class="z-40 transition" has-sider position="absolute" style="top: 64px;">
					<Sider/>
					<NLayoutContent class="h-full">
						<RouterView v-slot="{ Component, route }">
							<component :is="Component" :key="route.fullPath"/>
						</RouterView>
					</NLayoutContent>
				</NLayout>

			</NLayout>
		</div>
		<Permission :visible="needPermission"/>
	</div>
</template>

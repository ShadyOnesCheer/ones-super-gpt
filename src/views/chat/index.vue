<script lang='ts' setup>
import type {Ref} from 'vue'
import {computed, onMounted, onUnmounted, ref} from 'vue'
import {useRoute} from 'vue-router'
import {NAutoComplete, NButton, NInput, useDialog, useMessage} from 'naive-ui'
import {Message} from './components'
import {useScroll} from './hooks/useScroll'
import {useChat} from './hooks/useChat'
import {SvgIcon} from '@/components/common'
import {useBasicLayout} from '@/hooks/useBasicLayout'
import {fetchChatAPIProcess} from '@/api'
import {t} from '@/locales'
import {useChatStore} from '@/store'

let controller = new AbortController()

const openLongReply = import.meta.env.VITE_GLOB_OPEN_LONG_REPLY === 'true'

const route = useRoute()
const dialog = useDialog()
const ms = useMessage()

const chatStore = useChatStore()

const {isMobile} = useBasicLayout()
const {addChat, updateChat, updateChatSome, getChatByUuidAndIndex} = useChat()
const {scrollRef, scrollToBottom, scrollToBottomIfAtBottom} = useScroll()

const {uuid} = route.params as { uuid: string }

const dataSources = computed(() => chatStore.getChatByUuid(+uuid))
const conversationList = computed(() => dataSources.value.filter(item => (!item.inversion && !!item.conversationOptions)))

const prompt = ref<string>('')
const loading = ref<boolean>(false)
const inputRef = ref<Ref | null>(null)

// 未知原因刷新页面，loading 状态不会重置，手动重置
dataSources.value.forEach((item, index) => {
	if (item.loading)
		updateChatSome(+uuid, index, {loading: false})
})

function handleSubmit() {
	onConversation()
}

async function onConversation() {
	let message = prompt.value
	if (loading.value) return
	if (!message || message.trim() === '') return
	controller = new AbortController()
	addChat(
		+uuid,
		{
			dateTime: new Date().toLocaleString(),
			text: message,
			inversion: true,
			error: false,
			conversationOptions: null,
			requestOptions: {prompt: message, options: null},
		},
	)
	scrollToBottom()

	loading.value = true
	prompt.value = ''

	let options: Chat.ConversationRequest = {}
	const lastContext = conversationList.value[conversationList.value.length - 1]?.conversationOptions

	if (lastContext) options = {...lastContext}

	addChat(
		+uuid,
		{
			dateTime: new Date().toLocaleString(),
			text: '',
			loading: true,
			inversion: false,
			error: false,
			conversationOptions: null,
			requestOptions: {prompt: message, options: {...options}},
		},
	)
	scrollToBottom()

	try {
		let lastText = ''
		const fetchChatAPIOnce = async () => {
			await fetchChatAPIProcess<Chat.ConversationResponse>({
				prompt: message,
				options,
				signal: controller.signal,
				onDownloadProgress: ({event}) => {
					const xhr = event.target
					const {responseText} = xhr
					// Always process the final line
					const lastIndex = responseText.lastIndexOf('\n', responseText.length - 2)
					let chunk = responseText
					if (lastIndex !== -1)
						chunk = responseText.substring(lastIndex)
					try {
						const data = JSON.parse(chunk)
						updateChat(
							+uuid,
							dataSources.value.length - 1,
							{
								dateTime: new Date().toLocaleString(),
								text: lastText + (data.text ?? ''),
								inversion: false,
								error: false,
								loading: true,
								conversationOptions: {conversationId: data.conversationId, parentMessageId: data.id},
								requestOptions: {prompt: message, options: {...options}},
							},
						)

						if (openLongReply && data.detail.choices[0].finish_reason === 'length') {
							options.parentMessageId = data.id
							lastText = data.text
							message = ''
							return fetchChatAPIOnce()
						}

						scrollToBottomIfAtBottom()
					} catch (error) {
						//
					}
				},
			})
			updateChatSome(+uuid, dataSources.value.length - 1, {loading: false})
		}

		await fetchChatAPIOnce()
	} catch (error: any) {
		const errorMessage = error?.message ?? t('common.wrong')

		if (error.message === 'canceled') {
			updateChatSome(
				+uuid,
				dataSources.value.length - 1,
				{
					loading: false,
				},
			)
			scrollToBottomIfAtBottom()
			return
		}

		const currentChat = getChatByUuidAndIndex(+uuid, dataSources.value.length - 1)

		if (currentChat?.text && currentChat.text !== '') {
			updateChatSome(
				+uuid,
				dataSources.value.length - 1,
				{
					text: `${currentChat.text}\n[${errorMessage}]`,
					error: false,
					loading: false,
				},
			)
			return
		}

		updateChat(
			+uuid,
			dataSources.value.length - 1,
			{
				dateTime: new Date().toLocaleString(),
				text: errorMessage,
				inversion: false,
				error: true,
				loading: false,
				conversationOptions: null,
				requestOptions: {prompt: message, options: {...options}},
			},
		)
		scrollToBottomIfAtBottom()
	} finally {
		loading.value = false
	}
}

async function onRegenerate(index: number) {
	if (loading.value)
		return

	controller = new AbortController()

	const {requestOptions} = dataSources.value[index]

	let message = requestOptions?.prompt ?? ''

	let options: Chat.ConversationRequest = {}

	if (requestOptions.options)
		options = {...requestOptions.options}

	loading.value = true

	updateChat(
		+uuid,
		index,
		{
			dateTime: new Date().toLocaleString(),
			text: '',
			inversion: false,
			error: false,
			loading: true,
			conversationOptions: null,
			requestOptions: {prompt: message, options: {...options}},
		},
	)

	try {
		let lastText = ''
		const fetchChatAPIOnce = async () => {
			await fetchChatAPIProcess<Chat.ConversationResponse>({
				prompt: message,
				options,
				signal: controller.signal,
				onDownloadProgress: ({event}) => {
					const xhr = event.target
					const {responseText} = xhr
					// Always process the final line
					const lastIndex = responseText.lastIndexOf('\n', responseText.length - 2)
					let chunk = responseText
					if (lastIndex !== -1)
						chunk = responseText.substring(lastIndex)
					try {
						const data = JSON.parse(chunk)
						updateChat(
							+uuid,
							index,
							{
								dateTime: new Date().toLocaleString(),
								text: lastText + (data.text ?? ''),
								inversion: false,
								error: false,
								loading: true,
								conversationOptions: {conversationId: data.conversationId, parentMessageId: data.id},
								requestOptions: {prompt: message, options: {...options}},
							},
						)

						if (openLongReply && data.detail.choices[0].finish_reason === 'length') {
							options.parentMessageId = data.id
							lastText = data.text
							message = ''
							return fetchChatAPIOnce()
						}
					} catch (error) {
						//
					}
				},
			})
			updateChatSome(+uuid, index, {loading: false})
		}
		await fetchChatAPIOnce()
	} catch (error: any) {
		if (error.message === 'canceled') {
			updateChatSome(
				+uuid,
				index,
				{
					loading: false,
				},
			)
			return
		}

		const errorMessage = error?.message ?? t('common.wrong')

		updateChat(
			+uuid,
			index,
			{
				dateTime: new Date().toLocaleString(),
				text: errorMessage,
				inversion: false,
				error: true,
				loading: false,
				conversationOptions: null,
				requestOptions: {prompt: message, options: {...options}},
			},
		)
	} finally {
		loading.value = false
	}
}

function handleDelete(index: number) {
	if (loading.value)
		return

	dialog.warning({
		title: t('chat.deleteMessage'),
		content: t('chat.deleteMessageConfirm'),
		positiveText: t('common.yes'),
		negativeText: t('common.no'),
		onPositiveClick: () => {
			chatStore.deleteChatByUuid(+uuid, index)
		},
	})
}

function handleEnter(event: KeyboardEvent) {
	if (!isMobile.value) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault()
			handleSubmit()
		}
	} else {
		if (event.key === 'Enter' && event.ctrlKey) {
			event.preventDefault()
			handleSubmit()
		}
	}
}

function handleStop() {
	if (loading.value) {
		controller.abort()
		loading.value = false
	}
}

const placeholder = computed(() => {
	if (isMobile.value)
		return t('chat.placeholderMobile')
	return t('chat.placeholder')
})

const buttonDisabled = computed(() => {
	return loading.value || !prompt.value || prompt.value.trim() === ''
})

const footerClass = computed(() => {
	let classes = ['p-4']
	if (isMobile.value)
		classes = ['sticky', 'left-0', 'bottom-0', 'right-0', 'p-2', 'pr-3', 'overflow-hidden']
	return classes
})

onMounted(() => {
	scrollToBottom()
	if (inputRef.value && !isMobile.value)
		inputRef.value?.focus()
})

onUnmounted(() => {
	if (loading.value)
		controller.abort()
})
</script>

<template>
	<div class="flex flex-col w-full h-full">
		<main class="flex-1 overflow-hidden">
			<div id="scrollRef" ref="scrollRef" class="h-full overflow-hidden overflow-y-auto">
				<div
					id="image-wrapper"
					:class="[isMobile ? 'p-2' : 'p-4']"
					class="w-full max-w-screen-xl m-auto dark:bg-[#101014]"
				>
					<template v-if="!dataSources.length">
						<div class="flex items-center justify-center mt-4 text-center text-neutral-300">
							<SvgIcon class="mr-2 text-3xl" icon="ri:bubble-chart-fill"/>
							<span>Aha~</span>
						</div>
					</template>
					<template v-else>
						<div>
							<Message
								v-for="(item, index) of dataSources"
								:key="index"
								:date-time="item.dateTime"
								:error="item.error"
								:inversion="item.inversion"
								:loading="item.loading"
								:text="item.text"
								@delete="handleDelete(index)"
								@regenerate="onRegenerate(index)"
							/>
							<div class="sticky bottom-0 left-0 flex justify-center">
								<NButton v-if="loading" type="warning" @click="handleStop">
									<template #icon>
										<SvgIcon icon="ri:stop-circle-line"/>
									</template>
									Stop Responding
								</NButton>
							</div>
						</div>
					</template>
				</div>
			</div>
		</main>
		<footer :class="footerClass">
			<div class="w-full max-w-screen-xl m-auto">
				<div class="flex items-center justify-between space-x-2">
					<NAutoComplete v-model:value="prompt">
						<template #default="{ handleInput, handleBlur, handleFocus }">
							<NInput
								ref="inputRef"
								v-model:value="prompt"
								:autosize="{ minRows: 1, maxRows: isMobile ? 4 : 8 }"
								:placeholder="placeholder"
								type="textarea"
								@blur="handleBlur"
								@focus="handleFocus"
								@input="handleInput"
								@keypress="handleEnter"
							/>
						</template>
					</NAutoComplete>
					<NButton :disabled="buttonDisabled" type="primary" @click="handleSubmit">
						<template #icon>
              <span class="dark:text-black">
                <SvgIcon icon="ri:send-plane-fill"/>
              </span>
						</template>
					</NButton>
				</div>
			</div>
		</footer>
	</div>
</template>

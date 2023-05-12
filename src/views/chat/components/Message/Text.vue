<script lang="ts" setup>
import {computed, onMounted, onUnmounted, onUpdated, ref} from 'vue'
import MarkdownIt from 'markdown-it'
import mdKatex from '@traptitech/markdown-it-katex'
import mila from 'markdown-it-link-attributes'
import hljs from 'highlight.js'
import {useBasicLayout} from '@/hooks/useBasicLayout'
import {fetchConvert} from '@/api'

interface Props {
	inversion?: boolean
	error?: boolean
	text?: string
	loading?: boolean
	asRawText?: boolean
}

const props = defineProps<Props>()

const {isMobile} = useBasicLayout()

const textRef = ref<HTMLElement>()

const mdi = new MarkdownIt({
	html: false,
	linkify: true,
	highlight(code, language) {
		const validLang = !!(language && hljs.getLanguage(language))
		if (validLang) {
			const lang = language ?? ''
			return highlightBlock(hljs.highlight(code, {language: lang}).value, lang)
		}
		return highlightBlock(hljs.highlightAuto(code).value, '')
	},
})

mdi.use(mila, {attrs: {target: '_blank', rel: 'noopener'}})
mdi.use(mdKatex, {blockClass: 'katexmath-block rounded-md p-[10px]', errorColor: ' #cc0000'})

const wrapClass = computed(() => {
	return [
		'text-wrap',
		'min-w-[20px]',
		'rounded-md',
		'text-white',
		isMobile.value ? 'p-2' : 'px-3 py-2',
		props.inversion ? 'bg-[#2c6ef1]' : 'bg-[#f4f6f8]',
		props.inversion ? 'dark:bg-[#2c6ef1]' : 'dark:bg-[#1e1e20]',
		props.inversion ? 'message-request' : 'message-reply',
		{'text-red-500': props.error},
	]
})

const text = computed(() => {
	const value = props.text ?? ''
	if (!props.asRawText)
		return mdi.render(value)
	return value
})

function highlightBlock(str: string, lang?: string) {
	if (lang === 'json') {
		return `
		<pre class="code-block-wrapper">
			<div class="code-block-header">
				<span class="code-block-header__lang">${lang}</span>
				<span class="code-block-header__download">下载表格</span>
			</div>
			<code class="hljs code-block-body ${lang}">${str}</code>
		</pre>`
	}
	return `
		<pre class="code-block-wrapper">
			<div class="code-block-header">
				<span class="code-block-header__lang">${lang}</span>
			</div>
			<code class="hljs code-block-body ${lang}">${str}</code>
		</pre>`
}

function downloadExcelEvents() {
	if (textRef.value) {
		const downloadBtn = textRef.value?.querySelectorAll('.code-block-header__download')
		downloadBtn.forEach(btn => {
			btn?.addEventListener('click', async () => {
				const code = btn.parentElement?.nextElementSibling?.textContent
				if (code) {
					const {data} = await fetchConvert(code)
					const url = window.URL.createObjectURL(new Blob([data], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}))
					const link = document.createElement('a') // 例用a标签的download属性实现下载
					link.style.display = 'none'
					link.href = url
					link.setAttribute('download', 'task-import.xlsx')
					document.body.appendChild(link)// 在页面中动态添加一个a标签
					link.click()
					document.body.removeChild(link) // 点击之后删除该dom节点
				}
			})
		})
	}
}

function removeDownloadEvents() {
	if (textRef.value) {
		const copyBtn = textRef.value.querySelectorAll('.code-block-header__download')
		copyBtn.forEach((btn) => {
			btn.removeEventListener('click', () => {
			})
		})
	}
}

onMounted(() => {
	downloadExcelEvents()
})

onUpdated(() => {
	downloadExcelEvents()
})

onUnmounted(() => {
	removeDownloadEvents()
})
</script>

<template>
	<div :class="wrapClass" class="text-black">
		<div ref="textRef" class="leading-relaxed break-words">
			<div v-if="!inversion">
				<div v-if="!asRawText" class="markdown-body" v-html="text"/>
				<div v-else class="whitespace-pre-wrap" v-text="text"/>
			</div>
			<div v-else class="whitespace-pre-wrap" v-text="text"/>
			<template v-if="loading">
				<span class="dark:text-white w-[4px] h-[20px] block animate-blink"/>
			</template>
		</div>
	</div>
</template>

<style lang="less">
@import url(./style.less);
</style>

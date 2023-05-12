import type { GlobalThemeOverrides } from "naive-ui";
import { darkTheme, useOsTheme } from "naive-ui";
import { computed, watch } from "vue";
import { useAppStore } from "@/store";

export function useTheme() {
	const appStore = useAppStore();

	const OsTheme = useOsTheme();

	const isDark = computed(() => {
		if (appStore.theme === "auto") return OsTheme.value === "dark";
		else return appStore.theme === "dark";
	});

	const theme = computed(() => {
		return isDark.value ? darkTheme : undefined;
	});

	const themeOverrides = computed<GlobalThemeOverrides>(() => {
		if (isDark.value) {
			return {
				common: {
					primaryColor: "#2c6ef1",
					hoverColor: "#00acff",
				},
				Button: {
					colorHoverPrimary: "#2c6ef1",
					colorFocusPrimary: "#2c6ef1",
				},
			};
		}
		return {
			common: {
				primaryColor: "#2c6ef1",
				hoverColor: "#00acff",
			},
			Button: {
				colorHoverPrimary: "#2c6ef1",
				colorFocusPrimary: "#2c6ef1",
			},
		};
	});

	watch(
		() => isDark.value,
		(dark) => {
			if (dark) document.documentElement.classList.add("dark");
			else document.documentElement.classList.remove("dark");
		},
		{ immediate: true }
	);

	return { theme, themeOverrides };
}

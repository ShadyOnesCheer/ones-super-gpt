const ExcelJS = require('exceljs')


type DefaultEnter = string | number


type ExcelData = DefaultEnter[][]

export const convertArrayToExcel = async (excelData: ExcelData) => {
	const workbook = new ExcelJS.Workbook()
	const worksheet = workbook.addWorksheet('工作簿1')
	excelData.forEach((item, ix) => {
		const currentRow = worksheet.getRow(ix + 1)
		currentRow.values = item
	})
	return await workbook.xlsx.writeBuffer()
}

export const convert = async (val: string) => {
	try {
		const formatData = JSON.parse(val) as ExcelData
		return await convertArrayToExcel(formatData)
	} catch (e) {
		//
		console.log(e)
	}
}

// 輸入
export type BillInput = {
    date: string
    location: string
    tipPercentage: number
    items: BillItem[]
}

export type BillItem = SharedBillItem | PersonalBillItem

export type CommonBillItem = {
    price: number
    name: string
}

export type SharedBillItem = CommonBillItem & {
    isShared: true
}

export type PersonalBillItem = CommonBillItem & {
    isShared: false
    person: string
}

// 輸出
export type BillOutput = {
    date: string
    location: string
    subTotal: number
    tip: number
    totalAmount: number
    items: PersonItem[]
}

export type PersonItem = {
    name: string
    amount: number
}

// 請完成這個函式
export function splitBill(input: BillInput): BillOutput {
    let date = formatDate(input.date)
    let location = input.location
    let subTotal = calculateSubTotal(input.items)
    let tip = calculateTip(subTotal, input.tipPercentage)
    let totalAmount = Math.round((subTotal + tip) * 10) / 10
    let items = calculateItems(input.items, input.tipPercentage)
    adjustAmount(totalAmount, items)
    return {
        date,
        location,
        subTotal,
        tip,
        totalAmount,
        items,
    }
}

export function formatDate(date: string): string {
    // input format: YYYY-MM-DD, e.g. "2024-03-21"
    // output format: YYYY年M月D日, e.g. "2024年3月21日"
    const [year, month, day] = date.split("-")
    return `${year}年${parseInt(month)}月${parseInt(day)}日`
}

export function calculateSubTotal(items: BillItem[]): number {
    return items.reduce((sum, item) => sum + item.price, 0)
}

export function calculateTip(subTotal: number, tipPercentage: number): number {
// output round to closest 10 cents, e.g 12.34 -> 12.3
    return Math.round(subTotal * (tipPercentage / 100) * 10) / 10
}

function scanPersons(items: BillItem[]): string[] {
    const personsSet = new Set<string>()
    items.forEach(item => {
        if (!item.isShared) {
            personsSet.add(item.person)
        }
    })
    return Array.from(personsSet)
}

function calculateItems(
    items: BillItem[],
    tipPercentage: number,
): PersonItem[] {
    let names = scanPersons(items)
    let persons = names.length
    return names.map(name => ({
        name,
        amount: round1(calculatePersonAmount({
            items,
            tipPercentage,
            name,
            persons,
        })),
    }))
}

function calculatePersonAmount(input: {
    items: BillItem[]
    tipPercentage: number
    name: string
    persons: number
}): number {
    // for shared items, split the price evenly
    // for personal items, do not split the price
    // return the amount for the person
    let { items, tipPercentage, name, persons } = input
    let personalTotal = items
        .filter(item => !item.isShared && item.person === name)
        .reduce((sum, item) => sum + item.price, 0)
    let sharedTotal = items
        .filter(item => item.isShared)
        .reduce((sum, item) => sum + item.price / persons, 0)
    let total = personalTotal + sharedTotal
    let tip = Math.round(total * (tipPercentage / 100) * 10) / 10
    return total + tip
}

function adjustAmount(totalAmount: number, items: PersonItem[]): void {
// round all amounts to 0.1 first
    items.forEach(item => item.amount = round1(item.amount))
    let sum = items.reduce((acc, item) => acc + item.amount, 0)
    sum = Math.round(sum * 10) / 10
    let difference = Math.round((totalAmount - sum) * 10) / 10
// distribute the difference (should be at most 0.1)
    if (Math.abs(difference) >= 0.1) {
        let sign = difference > 0 ? 1 : -1
        for (let i = 0; Math.abs(difference) >= 0.1 && i < items.length; i++) {
            items[i].amount = round1(items[i].amount + 0.1 * sign)
            difference = Math.round((totalAmount - items.reduce((acc, item) => acc + item.amount, 0)) * 10) / 10
        }
    }
    // final rounding
    items.forEach(item => item.amount = round1(item.amount))
}

function round1(num: number): number {
    return Math.round(num * 10) / 10
}

'use strict'

let App = {}
let flatsFilter = {}

const roomsFilterButtons = document.querySelector('.js-rooms-filter-btns')
const pageMainContent = document.querySelector('.js-main')
const flat = document.querySelector('.js-flat')
const buttonUp = document.querySelector('.js-button-up')
const wrapListFlats = document.querySelector('.js-flats-list')
const resetButton = document.querySelector('.js-reset-button')
const forSearchMinMaxFlats = 10000
const breakPointMediumSize = 768
const numberOfCards = 20
let count = 0
let countElse = 1
let startState = 4

// вычислем размер линии прокрутки
let div = document.createElement('div')

div.style.overflowY = 'scroll'
div.style.width = '100%'
div.style.height = '50px'

document.body.append(div)

let scrollWidth = div.offsetWidth - div.clientWidth
div.remove()

// изменение местонахождения заголовка "Квартиры"
renderCreateTitle()
getResponse(startState, true)

window.addEventListener('resize', function() {
	renderCreateTitle()
})

// кнопки выбора количества комнат
roomsFilterButtons.addEventListener('click', function(e) {
	flatsFilter.rooms = []
	const target = e.target
	const currentItem = target.closest('.js-number-of-rooms')
	if (!currentItem) { return }

	currentItem.classList.toggle('active')
	const buttonsRooms = document.querySelectorAll('.js-number-of-rooms')

	buttonsRooms.forEach(item => {
		if (item.classList.contains('active')) {
			flatsFilter.rooms.push(+item.getAttribute('id'))
		}
	})
	App.hasArguments = flatsFilter.rangeArea ? ['rangeArea', 'area'] : ['rangeCost','cost']
	getResponse(App.stateView, false, 'roomsHandler', App.filterRender(...App.hasArguments))
})

// сбросить фильтр
resetButton.addEventListener('click', function() {
	let firstRangeSlider = $('.js-range-slider-input-cost').data("ionRangeSlider")
	const watchMoreBtn = document.querySelector('.js-watch-more-btn')
	const isActiveRoomsButton = document.querySelectorAll('.js-number-of-rooms')

	isActiveRoomsButton.forEach(button => button.classList.remove('active'))

	firstRangeSlider.reset()
	getResponse(startState, true, 'reset')
	count = 0
	flatsFilter = {}
	App.stateView = 4
	App.rangeCost = {}
	App.rangeArea = {}
	App.rooms = []

	if (!watchMoreBtn) {
		createButtonWatchMore(startState)
	}
})

// при прокрутке окна вниз показать кнопку "вверх"
window.addEventListener('scroll', function(e) {
	if (pageYOffset >= window.innerHeight / 2) {
		buttonUp.classList.add('show')
	} else {
		buttonUp.classList.remove('show')
	}
})

// плавно прокрутить к началу по нажатию на кнопку "вверх"
buttonUp.addEventListener('click', function() {
	pageMainContent.scrollIntoView({behavior: 'smooth'})
})
App.ascending = true
document.querySelector('.js-top-filter-block').addEventListener('click', filteredOfOptions)

// fetch
const flatHtmlTemplate = data =>
	`<li class="flats-list__item js-flat">
		<div class="flats-list__info">
			<h2 class="flats-list__title">${data.rooms}-комнатная № ${data.apartment}</h2>
			<div class="flats-list__options">
				<div class="flats-list__option flats-block__width">${data.options.area} <span>м<sup>2</sup></span></div>
				<div class="flats-list__option flats-block__width">${data.options.stage} <span>из 17 <span>этаж</span></span></div>
				<div class="flats-list__option flats-block__width">${reformatNumbers(data.options.cost)} <span>₽</span></div>
			</div>
		</div>
		<picture>
			<source srcset="${data.image}" type="image/webp">
			<img src="${data.image}" alt="${data.name}" class="flats-list__image">
		</picture>
</li>
`

// формат больших чисел с пробелами
function reformatNumbers(num) {
	return num.toLocaleString('ru-RU')
}

async function getResponse(num = 4, isFirstLoad = false, state = null, filtered = null) {
	const watchMoreBtn = document.querySelector('.js-watch-more-btn')
	const numbersOfRooms = document.querySelectorAll('.js-number-of-rooms')
	const numberOfRoomsButton = []
	const flatsData = []
	let numberOfContentItems = 0
	const url = 'https://ilyariver.github.io/kelnikflats.io/data.json'
	const response = await fetch(url)

	if (state !== 'slide' && state !== 'clickFilter') App.createSkeletons()

	if (response.ok) {
		const content = await response.json()
		const data = content
		// полуаем минимальные и максимальные значения ползунков
		const min = type => data.reduce((prev, curr) => Number.parseInt(prev.options[type]) < Number.parseInt(curr.options[type]) ? prev : curr)
		const max = type => data.reduce((prev, curr) => Number.parseInt(prev.options[type]) > Number.parseInt(curr.options[type]) ? prev : curr)

		if (watchMoreBtn && num >= data.length) {
			watchMoreBtn.remove()
		}

		const minCost = min('cost').options.cost
		const maxCost = max('cost').options.cost

		const minArea = min('area').options.area
		const maxArea = max('area').options.area

		if (isFirstLoad) {
			let firstRangeSlider = $('.js-range-slider-input-cost').data("ionRangeSlider")
			let firstAreaSlider = $('.js-range-slider-input-area').data("ionRangeSlider")

			firstRangeSlider.update({
				min: minCost - forSearchMinMaxFlats,
				max: maxCost + forSearchMinMaxFlats,
				from: minCost - forSearchMinMaxFlats,
				to: maxCost + forSearchMinMaxFlats,
			})

			firstAreaSlider.update({
				min: Number.parseInt(minArea),
				max: Number.parseInt(maxArea),
				from: Number.parseInt(minArea),
				to: Number.parseInt(maxArea),
			})
		}

		//получаем кнопки количества комнат
		numbersOfRooms.forEach(room => numberOfRoomsButton.push(+room.querySelector('span').textContent))
		data.forEach(flat => flatsData.push(flat.rooms))

		// дезактивируем кнопку, если нет такого количества комнат
		numberOfRoomsButton.filter(numOfRoom => {
			if (!flatsData.includes(numOfRoom)) {
				const rooms = document.getElementById(numOfRoom)
				rooms.setAttribute('disabled',true)
				rooms.classList.remove('hovered')
				rooms.style.cursor = 'auto'
			}
		})
		window.addEventListener('resize', function() {
			pageMainContent.style.width = ''
			pageMainContent.style.width = pageMainContent.clientWidth + 'px'
		})

		// загрузить кнопку "Загрузить еще" вместе с контентом
		if (countElse === 1 && !state) {
			countElse++
			await createButtonWatchMore(num)
		}

		// если на странице появилась полоса прокрутки, то делаем, чтобы контент не сдвинулся
		if (!getScroll('Height') || !state) {
			pageMainContent.style.width = ''
			pageMainContent.style.width = pageMainContent.clientWidth - scrollWidth + 'px'
		}

		// список по умолчанию
		numberOfContentItems = content.length
		if (state !== 'clickFilter') App.contentSplice = content.splice(0, num)

		if ((filtered && state === 'handler') || (filtered && state === 'clickFilter')) {
			filtered = App.filterRender(...App.hasArguments)
		}

		// выводим карточки квартир
		const filteredOrDefault = filtered ? filtered : App.contentSplice
		let listToHtml = filteredOrDefault.map(item => flatHtmlTemplate(item))

		setTimeout(() => {
			wrapListFlats.innerHTML = listToHtml.join('')
			const flatsItemsOfDOM = document.querySelectorAll('.js-flat')

			flatsItemsOfDOM.forEach(item => item.style.opacity = '0')

			document.querySelectorAll('.js-skeletons').forEach(item => item.remove())

			setTimeout(() => {
				flatsItemsOfDOM.forEach(item => item.style.cssText = `
					opacity: '1';
					transition: opacity 0.2s ease;
				`)
			},100)

			showNoticeMessage()
			removeWatchMoreButton()
		},500)

		App.filterRender = (type = 'rangeCost', meth = 'cost') => {
			let filterValue = ''
			let flatRoomsChecked = flatsFilter.rooms ? flatsFilter.rooms.length : false

			if (flatRoomsChecked) {
				filterValue = App.contentSplice.filter(item => flatsFilter.rooms.includes(item.rooms))
			}

			if (flatsFilter[type]) {
				const roomsOrDefault = flatRoomsChecked ? filterValue : App.contentSplice
				filterValue = roomsOrDefault.filter(item =>
					flatsFilter[type] && Number.parseInt(item.options[meth]) >=
					flatsFilter[type].from && Number.parseInt(item.options[meth]) <=
					flatsFilter[type].to)
			}
			const revert = type === 'rangeCost' ? flatsFilter['rangeArea'] : flatsFilter['rangeCost']
			const method = type === 'rangeCost' ? 'area' : 'cost'

			if (!revert || !filterValue.length) {
				return filterValue
			}
			return filterValue.filter(item =>
				revert && Number.parseInt(item.options[method]) >=
				revert.from && Number.parseInt(item.options[method]) <=
				revert.to)
		}

		function showNoticeMessage() {
			const cardsFlatOfDOM = document.querySelectorAll('.js-flat')
			const noticeOfEmpty = document.querySelector('.js-notice-of-empty')

			if (!cardsFlatOfDOM.length && !noticeOfEmpty) {
				$('<p/>', {
					'class': 'notice-of-empty js-notice-of-empty',
					'text': 'Квартиры по заданному фильтру отсутствуют...'
				}).appendTo('.js-flats-block')

				countElse = 1
			}

			// удалить надпись "Квартиры по заданному фильтру отсутствуют..."
			if (cardsFlatOfDOM.length && noticeOfEmpty) {
				noticeOfEmpty.remove()
			}
		}

		function removeWatchMoreButton() {
			const cardsFlatOfDOM = document.querySelectorAll('.js-flat')
			const watchMoreButton = document.querySelector('.js-watch-more-btn')

			// удалить кнопку "загрузить еще"
			if (!watchMoreButton) { return }
			if (cardsFlatOfDOM.length === numberOfContentItems) {
				watchMoreButton.remove()

				countElse = 1
			}
		}
	} else {
		alert('Ошибка: ' + response.status)
	}
}

App.createSkeletons = function () {
	const emptyNotice = document.querySelector('.js-notice-of-empty')
	if (emptyNotice) {
		emptyNotice.remove()
	}

	wrapListFlats.innerHTML = ''
	wrapListFlats.insertAdjacentHTML('beforeend', `
		<li class="flats-list__skeletons skeletons js-skeletons">
			<div class="skeletons__body">
				<span class="skeletons__text"></span>
				<span class="skeletons__text"></span>
				<span class="skeletons__text"></span>
			</div>
			<div class="skeletons__img"></div>
		</li>
		<li class="flats-list__skeletons skeletons js-skeletons">
			<div class="skeletons__body">
				<span class="skeletons__text"></span>
				<span class="skeletons__text"></span>
				<span class="skeletons__text"></span>
			</div>
			<div class="skeletons__img"></div>
		</li>
		<li class="flats-list__skeletons skeletons js-skeletons">
			<div class="skeletons__body">
				<span class="skeletons__text"></span>
				<span class="skeletons__text"></span>
				<span class="skeletons__text"></span>
			</div>
			<div class="skeletons__img"></div>
		</li>
		<li class="flats-list__skeletons skeletons js-skeletons">
			<div class="skeletons__body">
				<span class="skeletons__text"></span>
				<span class="skeletons__text"></span>
				<span class="skeletons__text"></span>
			</div>
			<div class="skeletons__img"></div>
		</li>`)
}

function filteredOfOptions(e) {
	const target = e.target
	const targetPushed = target.closest('.filters-list__arrow-btn')

	if (!targetPushed) { return }

	const typeFilter = targetPushed.dataset.option

	document.querySelectorAll('.filters-list__arrow-btn').forEach(item => item.style.color = '#0b1739')
	target.closest('.filters-list__arrow-btn').style.color = '#3EB57C'

	renderFilterOfType(typeFilter)

}

function renderFilterOfType(typeFilter) {
	App.contentSplice.sort(byField('options', typeFilter))
	App.contentSplice = App.contentSplice.filter(item => App.contentSplice.map(user => user.options[typeFilter]).includes(item.options[typeFilter]))
	App.hasArguments = flatsFilter.rangeArea ? ['rangeArea', 'area'] : ['rangeCost','cost']

	const filtered = flatsFilter ? App.filterRender(...App.hasArguments) : false
	getResponse(App.stateView, false, 'clickFilter', filtered)
}

function byField(field, typeFilter) {
	if (App.ascending) {
		App.ascending = false
		return (a, b) => Number.parseInt(a[field][typeFilter]) > Number.parseInt(b[field][typeFilter]) ? 1 : -1;
	}
	App.ascending = true
	return (a, b) => Number.parseInt(a[field][typeFilter]) < Number.parseInt(b[field][typeFilter]) ? 1 : -1;
}
// проверка наличия скролла
function getScroll(a) {
	const d = document,
		b = d.body,
		e = d.documentElement,
		c = "client" + a;
	a = "scroll" + a;
	return /CSS/.test(d.compatMode)? (e[c]< e[a]) : (b[c]< b[a])
}
// функция создания конпки "заргузить еще"
function createButtonWatchMore(num) {
	$('<button/>', {
		'type': 'button',
		'class': 'watch-more-btn js-watch-more-btn',
		'text': 'Загрузить еще'
	}).appendTo('.js-section-flats-container')

	// загрузить 20 карточек
	document.querySelector('.js-watch-more-btn').addEventListener('click', function() {
		App.hasArguments = flatsFilter.rangeArea ? ['rangeArea', 'area'] : ['rangeCost','cost']
		App.stateView = numberOfCards + num

		const filtered = flatsFilter ? App.filterRender(...App.hasArguments) : false
		count += numberOfCards + num
		getResponse(count, false, 'handler', filtered)

		num = 0
	})
}

function renderCreateTitle() {
	if (window.innerWidth >= breakPointMediumSize) {
		return createTitle('.js-flats-block')
	}
	createTitle('.js-section-flats-container')
}

function createTitle(whereTo) {
	document.getElementById('main-title').remove()
	$('<div/>', {
		id: 'main-title',
		'class': 'section-flats__title js-flats-block-title',
		'text': 'Квартиры'
	}).prependTo(whereTo)
}

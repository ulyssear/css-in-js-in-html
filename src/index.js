const generic_opened_characters = {
	parenthesis: 0,
	bracket: 0,
	brace: 0,
	single_quote: 0,
	double_quote: 0,
	backtick: 0,
};

const dict_characters = {
	'(': 'parenthesis-start',
	')': 'parenthesis-end',
	'[': 'bracket-start',
	']': 'bracket-end',
	'{': 'brace-start',
	'}': 'brace-end',
	"'": 'single_quote',
	'"': 'double_quote',
	'`': 'backtick',
};

const generic_entry = {
	original: undefined,
	events: undefined,
	selectors: undefined,
	classes: undefined,
};

function split_classname_to_classes_groups(className) {
	const opened_characters = Object.assign({}, generic_opened_characters);

	const group_classes = [];
	let temp_class = '';

	for (let i = 0; i < className.length; i++) {
		let character = className[i];
		const next_character = className[i + 1];

		if (character + next_character === '//') {
			i += className.slice(i).indexOf('\n');
			continue;
		}

		if (character + next_character === '/*') {
			i += className.slice(i).indexOf('*/') + 1;
			continue;
		}

		const character_type = {
			type: dict_characters[character]?.replace('-start', '').replace('-end', ''),
			variant: dict_characters[character] ? dict_characters[character].split('-')[1] : undefined,
		};

		if (character_type.variant === 'start') {
			opened_characters[character_type.type] += 1;
		}

		if (character_type.variant === 'end') {
			opened_characters[character_type.type] -= 1;
		}

		const total_opened_characters = Object.values(opened_characters).reduce((a, b) => a + b, 0);

		if (['\t', '\r', '\n'].includes(character)) {
			character = ' ';
		}

		temp_class += character;

		if (0 === total_opened_characters && 0 < temp_class.length && (i === className.length - 1 || ' ' === character)) {
			const entry = Object.assign({}, generic_entry);
			entry.original = temp_class.trim();

			const opened_characters_entry = Object.assign({}, generic_opened_characters);

			const group_classes_entry = [];
			let temp_group = '';

			for (let j = 0; j < entry.original.length; j++) {
				const character = entry.original[j];

				const character_type = {
					type: dict_characters[character]?.replace('-start', '').replace('-end', ''),
					variant: dict_characters[character] ? dict_characters[character].split('-')[1] : undefined,
				};

				if (character_type.variant === 'start') {
					opened_characters_entry[character_type.type] += 1;
				}

				if (character_type.variant === 'end') {
					opened_characters_entry[character_type.type] -= 1;
				}

				const total_opened_characters_entry = Object.values(opened_characters_entry).reduce((a, b) => a + b, 0);

				temp_group += character;

				if (0 === total_opened_characters_entry && (':' === character || j === entry.original.length - 1)) {
					group_classes_entry.push(temp_group.trim());

					if (0 < group_classes_entry.length && temp_group.trim().startsWith('[@media(') && temp_group.trim().endsWith(']:')) {
						entry.media_query = temp_group.trim().substring(8, temp_group.trim().length - 3);
					}

					temp_group = '';
				}
			}

			if (1 > group_classes_entry.length) {
				continue;
			}

			// from serialized classes to array of classes
			entry.classes = (function deserializeClasses(_classes) {
				if (_classes.startsWith('{') && _classes.endsWith('}')) {
					_classes = _classes.substring(1, _classes.length - 1);
				}
				const opened_characters_classes = Object.assign({}, generic_opened_characters);
				const classes = [];
				let temp_class_entry = '';
				for (let k = 0; k < _classes.length; k++) {
					const character = _classes[k];
					const character_type = {
						type: dict_characters[character]?.replace('-start', '').replace('-end', ''),
						variant: dict_characters[character] ? dict_characters[character].split('-')[1] : undefined,
					};

					if (character_type.variant === 'start') {
						opened_characters_classes[character_type.type] += 1;
					}

					if (character_type.variant === 'end') {
						opened_characters_classes[character_type.type] -= 1;
					}

					const total_opened_characters_classes = Object.values(opened_characters_classes).reduce((a, b) => a + b, 0);

					temp_class_entry += character;

					if (0 === total_opened_characters_classes && (character === ' ' || k === _classes.length - 1) && '' !== temp_class_entry.trim()) {
						classes.push(temp_class_entry.trim());
						temp_class_entry = '';
					}
				}
				// console.log({classes})
				return classes;
			})(group_classes_entry[group_classes_entry.length - 1]);

			// from serialized events to array of events
			entry.events = (function deserializeEvents(_events) {
				if (!_events) return undefined;
				if (_events.startsWith('[') || _events.endsWith(']')) return undefined;
				if (_events.endsWith(':')) {
					_events = _events.substring(0, _events.length - 1);
				}
				if (_events.startsWith('{') && _events.endsWith('}')) {
					_events = _events.substring(1, _events.length - 1);
				}
				return _events.split(',');
			})(!entry.media_query ? group_classes_entry[group_classes_entry.length - 3] : undefined);

			// from serialized selectors to array of selectors
			entry.selectors = (function deserializeSelectors(_selectors) {
				if (!_selectors) return undefined;
				if (!(_selectors.startsWith('[') && (_selectors.endsWith(']') || _selectors.endsWith(']:')))) return undefined;
				if (_selectors.startsWith('[@media(')) return undefined;

				_selectors = _selectors.substring(1, _selectors.length - (1 + +_selectors.endsWith(']:')));

				if (_selectors.includes('@lookout')) {
					const [selector_to_look, selector_to_apply] = _selectors.split('@lookout');
					return {
						tag: 'lookout',
						before: deserializeSelectors(selector_to_look.trim()),
						after: deserializeSelectors(selector_to_apply.trim()),
					};
				}

				if (['>', '+', '~'].includes(_selectors[0])) {
					return {
						tag: _selectors[0],
						selectors: deserializeSelectors(`[${_selectors.substring(1).trim()}]`),
					};
				}

				const opened_characters_selectors = Object.assign({}, generic_opened_characters);
				const selectors = [];
				let temp_selector_entry = '';

				for (let k = 0; k < _selectors.length; k++) {
					const character = _selectors[k];
					const character_type = {
						type: dict_characters[character]?.replace('-start', '').replace('-end', ''),
						variant: dict_characters[character] ? dict_characters[character].split('-')[1] : undefined,
					};

					if (character_type.variant === 'start') {
						opened_characters_selectors[character_type.type] += 1;
					}

					if (character_type.variant === 'end') {
						opened_characters_selectors[character_type.type] -= 1;
					}

					const total_opened_characters_selectors = Object.values(opened_characters_selectors).reduce((a, b) => a + b, 0);

					temp_selector_entry += character;

					// console.log(temp_selector_entry)

					if (0 === total_opened_characters_selectors && (character === ',' || k === _selectors.length - 1)) {
						let selector = temp_selector_entry.trim();
						if (selector.startsWith(',')) {
							selector = selector.substring(1, selector.length);
						}
						if (selector.endsWith(',')) {
							selector = selector.substring(0, selector.length - 1);
						}
						selectors.push(selector);
						temp_selector_entry = '';
					}
				}
				return selectors;
			})(!entry.media_query ? group_classes_entry[group_classes_entry.length - 2] : group_classes_entry[group_classes_entry.length - 3]);

			temp_class = '';
			group_classes.push(entry);
			// console.log({entry})
		}
	}

	return group_classes;
}

function apply_custom_class(element, className) {
	// window.addEventListener('resize', () => apply_custom_class(element, className));

	const group_classes = split_classname_to_classes_groups(className);

	for (let i = 0; i < group_classes.length; i++) {
		const { selectors, classes, events, media_query } = group_classes[i];

		let classes_to_apply = [];
		for (let j = 0; j < classes.length; j++) {
			const class_entry = classes[j];

			if ('[' === class_entry[0]) {
				apply_custom_class(element, class_entry);
				continue;
			}

			const lastIndexOf = class_entry.lastIndexOf('-[');
			const class_name = class_entry.substring(0, lastIndexOf);
			const class_value = class_entry.substring(lastIndexOf + 1, class_entry.length);
			classes_to_apply.push({
				name: class_name,
				value: class_value.substring(1, class_value.length - 1),
			});
		}
		element.className = element.className.replace(className, '').trim();
		// console.log({classes_to_apply})

		// console.log({ selectors, classes_to_apply, events, media_query });

		do_apply(element, selectors, classes_to_apply, events, media_query);
	}
}

function do_apply(element, selectors, classes, events, media_query) {
	if (media_query) {
		if ('(' !== media_query[0]) {
			media_query = `(${media_query})`;
		}	
		if (!window.matchMedia(media_query).matches) {
			return;
		}
	}

	let elements_to_apply = [element];

	if (selectors) {
		elements_to_apply = [];
		if (typeof selectors === 'object' && !Array.isArray(selectors)) {
			selectors = [selectors];
		}
		for (let j = 0; j < selectors.length; j++) {
			const selector = selectors[j];
			if (typeof selector === 'object') {
				const { tag } = selector;
				if (tag === 'lookout') {
					let before_to_apply = [];
					let after_to_apply = [];
					const { before, after } = selector;
					// checks if before selector matches
					for (let b = 0; b < before.length; b++) {
						const before_selector = before[b];
						const elements = document.querySelectorAll(before_selector);
						for (let e = 0; e < elements.length; e++) {
							const element = elements[e];
							if (element.matches(before_selector)) {
								elements_to_apply.push(element);
								before_to_apply.push(element);
							}
						}
					}
					// checks if after selector matches
					for (let a = 0; a < after.length; a++) {
						const after_selector = after[a];
						const elements = document.querySelectorAll(after_selector);
						for (let e = 0; e < elements.length; e++) {
							const element = elements[e];
							if (element.matches(after_selector)) {
								elements_to_apply.push(element);
								after_to_apply.push(element);
							}
						}
					}
				}
				if ('>' === tag && selector.selectors) {
					const { selectors } = selector;
					for (let k = 0; k < element.children.length; k++) {
						const child = element.children[k];
						do_apply(child, selectors, classes, events, media_query);
					}
				}
				continue;
			}
			const elements = element.querySelectorAll(selector);
			for (let k = 0; k < elements.length; k++) {
				elements_to_apply.push(elements[k]);
			}
		}
	}

	if (events) {
		for (let j = 0; j < events.length; j++) {
			const event = events[j];
			for (let k = 0; k < elements_to_apply.length; k++) {
				const element_to_apply = elements_to_apply[k];
				element_to_apply.addEventListener(
					event,
					() => {
						for (let l = 0; l < classes.length; l++) {
							const { name, value } = classes[l];
							element.style.setProperty(name, value);
						}
					},
					false,
				);
			}
		}
		return;
	}

	for (let j = 0; j < elements_to_apply.length; j++) {
		const element_to_apply = elements_to_apply[j];
		if (!element_to_apply) continue;
		for (let k = 0; k < classes.length; k++) {
			const { name, value } = classes[k];
			element_to_apply.style.setProperty(name, value);
		}
	}
}

function init(document, event = undefined) {
	const tag_console = `init : ${event ? `(${event.type})` : ''}`;
	console.time(tag_console);
	// console.log(event?.type);

	const elements = document.querySelectorAll('*:not(head, head *)[class]');

	for (let i = 0; i < elements.length; i++) {
		const element = elements[i];
		try {
			apply_custom_class(element, element.className);
		} catch (error) {
			console.error(error);
		}
	}

	const observer = new MutationObserver(init_observer);
	observer.observe(document, {
		attributes: true,
		attributeFilter: ['class'],
		childList: true,
		subtree: true,
	});

	console.timeEnd(tag_console);

	document.body.removeAttribute('aria-busy');
	document.body.removeAttribute('hidden');
}

function init_observer(record) {
	console.time('init_observer');
	for (let i = 0; i < record.length; i++) {
		const { type, target, attributeName } = record[i];
		if (type === 'attributes' && attributeName === 'class') {
			apply_custom_class(target, target.className);
		}
		if (type === 'childList') {
			const elements = target.querySelectorAll('*:not(head, head *)[class]');
			for (let j = 0; j < elements.length; j++) {
				const element = elements[j];
				apply_custom_class(element, element.className);
			}
		}
	}
	console.timeEnd('init_observer');
}

const CSS_IN_JS_IN_HTML = {
	// apply: apply_custom_class,
	init,
	fromClassNameToGroups: split_classname_to_classes_groups
};

window.CSS_IN_JS_IN_HTML = CSS_IN_JS_IN_HTML;

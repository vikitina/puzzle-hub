import { scanwordRu } from './scanword/ru';
import type { Dictionary } from '../types';
import { fillwordRu } from './fillword/ru';
import { nonogramRu } from './nonogram/ru';
import { codewordRu } from './codeword/ru';

export const ru = {
  codeword: codewordRu,
  scanword: scanwordRu,
  nonogram: nonogramRu,
  fillword: fillwordRu,
  app: { name: 'Puzzle Workshop', subtitle: 'Создавай и решай головоломки' },
  navigation: {
    label: 'Головоломки',
    menu: 'Меню',
    home: 'Главная',
    sudoku: 'Судоку',
    nonogram: 'Японский кроссворд',
    wordSearch: 'Филворд',
    codeword: 'Ключворд',
    scanword: 'Сканворд',
  },
  theme: { light: 'Включить светлую тему', dark: 'Включить тёмную тему' },
  language: { label: 'Язык интерфейса' },
  common: {
    open: 'Открыть',
    back: 'На главную',
    comingSoon: 'В разработке',
    skip: 'Перейти к основному содержимому',
  },
  home: {
    title: 'Место для головоломок',
    description:
      'Выбери головоломку для игры. Позже здесь появятся и другие виды.',
  },
  puzzles: {
    sudoku:
      'Заполни поле так, чтобы в каждой строке, столбце и блоке числа не повторялись.',
    nonogram: 'Открой изображение по числовым подсказкам возле поля.',
    wordSearch: 'Найди спрятанные слова на поле с буквами.',
    codeword: 'Определи, какую букву обозначает каждое число.',
    scanword: 'Разгадай подсказки и впиши слова по направлениям стрелок.',
  },
  notFound: {
    title: 'Страница не найдена',
    description: 'По этому адресу нет страницы.',
  },
  sudoku: {
    instructions: 'Вводи числа от 1 до {size}. Исходные числа менять нельзя.',
    solved: 'Решено! Все числа на своих местах.',
    conflict: 'Некоторые числа повторяются в строке, столбце или блоке.',
    reset: 'Начать заново',
    board: 'Поле судоку',
    row: 'Строка',
    column: 'столбец',
    given: 'исходное число',
    settings: {
      title: 'Настройки новой игры',
      description:
        'Выбери параметры поля и создай новую игру. Текущая игра останется, пока новая не будет готова.',
      size: 'Размер поля',
      clues: 'Открытых клеток',
      cluesHint: 'Целое число от 0 до {max}.',
      invalid: 'Введи целое число от 0 до {max}.',
      block: 'Блок (строки × столбцы)',
      blocks: 'Блоки (гориз. × верт.)',
      cells: 'Всего клеток',
      empty: 'Клеток скрыть',
      create: 'Создать новую игру',
    },
    generation: {
      running: 'Создаём головоломку…',
      cancel: 'Отменить',
      cancelled: 'Создание отменено. Текущая игра сохранена.',
      failed: 'Не удалось создать головоломку. Попробуй ещё раз.',
      timeout:
        'Создание занимает слишком много времени. Попробуй оставить больше открытых клеток.',
      targetNotReached:
        'Запрошено {target} открытых клеток. Оставлено {actual}, чтобы сохранить единственное решение.',
      gameInfo: 'Открыто клеток: {actual} из {total}.',
    },
  },
} satisfies Dictionary;
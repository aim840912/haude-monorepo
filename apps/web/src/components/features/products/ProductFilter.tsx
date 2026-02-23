import { cn } from '@/lib/utils'

interface ProductFilterProps {
  /** Selected category */
  selectedCategory: string
  /** Category change handler */
  onCategoryChange: (category: string) => void
  /** Available category list */
  categories: string[]
}

/**
 * Category filter pills.
 * Simplified from full search/sort/filter to category-only pill buttons.
 */
export function ProductFilter({
  selectedCategory,
  onCategoryChange,
  categories,
}: ProductFilterProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <button
        onClick={() => onCategoryChange('')}
        className={cn(
          'px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200',
          selectedCategory === ''
            ? 'bg-green-700 dark:bg-green-600 text-white shadow-sm'
            : 'bg-[#efebe9] dark:bg-[#3e2723] border border-[#d7ccc8] dark:border-[#5d4037] text-[#5d4037] dark:text-[#bcaaa4] hover:bg-[#d7ccc8] dark:hover:bg-[#4e342e] hover:text-[#3e2723] dark:hover:text-[#d7ccc8]'
        )}
      >
        全部
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200',
            selectedCategory === category
              ? 'bg-green-700 dark:bg-green-600 text-white shadow-sm'
              : 'bg-[#efebe9] dark:bg-[#3e2723] border border-[#d7ccc8] dark:border-[#5d4037] text-[#5d4037] dark:text-[#bcaaa4] hover:bg-[#d7ccc8] dark:hover:bg-[#4e342e] hover:text-[#3e2723] dark:hover:text-[#d7ccc8]'
          )}
        >
          {category}
        </button>
      ))}
    </div>
  )
}

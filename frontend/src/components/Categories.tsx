import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";
import { useEffect, useRef, useState } from "react";

interface CategoryProps {
  categories: string[];
  selectedCategory: string;
  onSelect: (category: string) => void;
}

const TRANSLATE_AMOUNT = 200;

const Categories = ({
  categories,
  selectedCategory,
  onSelect,
}: CategoryProps) => {
  const [isLeftVisible, setIsLeftVisible] = useState(false);
  const [isRightVisible, setIsRightVisible] = useState(true);
  const [translate, setTranslate] = useState(0);
  const conatinerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conatinerRef.current == null) return;

    const observer = new ResizeObserver((entries) => {
      // console.log(entries)

      const container = entries[0]?.target;
      if (container == null) return;

      setIsLeftVisible(translate > 0);
      setIsRightVisible(
        translate + container.clientWidth < container.scrollWidth
      );
    });

    observer.observe(conatinerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [categories, translate]);

  return (
    <div ref={conatinerRef} className="overflow-x-hidden relative">
      <div
        className=" flex whitespace-nowrap gap-3 transition-transform w-[max-content]"
        style={{ transform: `translateX(-${translate}px)` }}
      >
        {categories.map((category) => (
          <Button
            className={`py-1.5 px-3.5 rounded-lg whitespace-nowrap  text-[14px] font-medium  ${selectedCategory === category ? "dark:bg-white" : ""} `}
            variant={selectedCategory === category ? "dark" : "default"}
            onClick={() => onSelect(category)}
            key={category}
          >
            {category}
          </Button>
        ))}
      </div>

      {isLeftVisible && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 bg-gradient-to-r from-white from-50% to-transparent w-28 h-full dark:from-[#0F0F0F] dark:bg-gradient-to-r">
          <Button
            variant="ghost"
            size="icon"
            className=" h-full aspect-square w-auto p-1.5"
            onClick={() => {
              setTranslate((translate) => {
                const newTranslate = translate - TRANSLATE_AMOUNT;
                if (newTranslate <= 0) return 0;
                return newTranslate;
              });
            }}
          >
            <ChevronLeft />
          </Button>
        </div>
      )}

      {isRightVisible && (
        <div className="absolute  right-0 top-1/2 -translate-y-1/2 bg-gradient-to-l from-white from-50% to-transparent w-28 h-full flex justify-end dark:from-[#0F0F0F] dark:bg-gradient-to-l">
          <Button
            variant="ghost"
            size="icon"
            className=" h-full aspect-square w-auto p-1.5"
            onClick={() => {
              setTranslate((translate) => {
                if (conatinerRef.current == null) {
                  return translate;
                }
                const newTranslate = translate + TRANSLATE_AMOUNT;
                const edge = conatinerRef.current.scrollWidth;   // how much the container can scroll/how wide this is
                const width = conatinerRef.current.clientWidth;  // this is the visible width we are seeing
                if (newTranslate + width >= edge) {
                  return edge - width;
                }
                return newTranslate;
              });
            }}
          >
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Categories;

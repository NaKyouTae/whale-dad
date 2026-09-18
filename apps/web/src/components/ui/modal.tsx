"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/** 작은 화면에서는 아래에서 올라오는 시트, 넓은 화면에서는 가운데 모달 */
export function Modal({ title, description, onClose, children, footer, className }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // 열리면 포커스를 모달 안으로 가져온다.
  // 이렇게 하지 않으면 모달이 떠 있는 동안에도 포커스가 뒤쪽 버튼에 남아,
  // 키보드로 닫는 순간 그 버튼에 포커스 링이 그려진다.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus({ preventScroll: true });

    return () => {
      // 돌아갈 때 링이 다시 그려지지 않도록 포커스만 풀어준다
      previous?.blur();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Tab 이 모달 밖으로 새지 않도록 가둔다
      if (e.key !== "Tab" || !panelRef.current) return;

      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-grey-900/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-[440px] rounded-t-2xl bg-white p-5 shadow-float outline-none sm:rounded-2xl",
          // 아래에서 올라오는 시트일 때 iPhone 홈 인디케이터에 버튼이 가리지 않도록
          "pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-5",
          // 내용이 길면 화면을 넘지 않게 스크롤
          "max-h-[90dvh] overflow-y-auto",
          className,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-title text-grey-900">{title}</h2>
            {description && <p className="mt-0.5 text-caption text-grey-500">{description}</p>}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="press flex size-9 shrink-0 items-center justify-center rounded-sm text-grey-500 hover:bg-grey-100"
          >
            <X size={18} />
          </button>
        </div>

        {children}

        {footer && <div className="mt-5 flex gap-2">{footer}</div>}
      </div>
    </div>
  );
}

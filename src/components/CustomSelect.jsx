import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

export function CustomSelect({
  id,
  label,
  value,
  options,
  placeholder = "请选择",
  disabled = false,
  onChange,
}) {
  const generatedId = useId();
  const fieldId = id || `custom-select-${generatedId}`;
  const labelId = `${fieldId}-label`;
  const listboxId = `${fieldId}-listbox`;
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value],
  );

  const selectedOption =
    selectedIndex >= 0 ? options[selectedIndex] : null;

  useEffect(() => {
    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );
    };
  }, []);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  useEffect(() => {
    if (open) {
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [open, selectedIndex]);

  function openMenu() {
    if (!disabled && options.length > 0) {
      setOpen(true);
    }
  }

  function closeMenu({ restoreFocus = false } = {}) {
    setOpen(false);

    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  }

  function selectOption(option) {
    onChange(option.value);
    closeMenu({ restoreFocus: true });
  }

  function moveActiveIndex(step) {
    if (options.length === 0) {
      return;
    }

    setActiveIndex((currentIndex) => {
      const startingIndex =
        currentIndex >= 0 ? currentIndex : selectedIndex;

      return (
        startingIndex + step + options.length
      ) % options.length;
    });
  }

  function handleKeyDown(event) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        openMenu();
        moveActiveIndex(1);
        break;

      case "ArrowUp":
        event.preventDefault();
        openMenu();
        moveActiveIndex(-1);
        break;

      case "Home":
        if (open) {
          event.preventDefault();
          setActiveIndex(0);
        }
        break;

      case "End":
        if (open) {
          event.preventDefault();
          setActiveIndex(options.length - 1);
        }
        break;

      case "Enter":
      case " ":
        event.preventDefault();

        if (!open) {
          openMenu();
        } else if (activeIndex >= 0) {
          selectOption(options[activeIndex]);
        }
        break;

      case "Escape":
        if (open) {
          event.preventDefault();
          closeMenu({ restoreFocus: true });
        }
        break;

      case "Tab":
        setOpen(false);
        break;

      default:
        break;
    }
  }

  const activeOptionId =
    open && activeIndex >= 0
      ? `${fieldId}-option-${activeIndex}`
      : undefined;

  return (
    <div className="custom-select-field">
      <span className="custom-select-label" id={labelId}>
        {label}
      </span>

      <div
        className={`custom-select${open ? " is-open" : ""}`}
        ref={rootRef}
      >
        <button
          className="custom-select-trigger"
          id={fieldId}
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-controls={listboxId}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-labelledby={`${labelId} ${fieldId}`}
          aria-activedescendant={activeOptionId}
          disabled={disabled}
          onClick={() => {
            if (open) {
              closeMenu();
            } else {
              openMenu();
            }
          }}
          onKeyDown={handleKeyDown}
        >
          <span className={selectedOption ? "" : "is-placeholder"}>
            {selectedOption?.label ?? placeholder}
          </span>

          <span className="custom-select-chevron" aria-hidden="true" />
        </button>

        {open && (
          <ul
            className="custom-select-menu"
            id={listboxId}
            role="listbox"
            aria-labelledby={labelId}
          >
            {options.map((option, index) => {
              const selected = option.value === value;
              const active = index === activeIndex;

              return (
                <li
                  className={`custom-select-option${
                    selected ? " is-selected" : ""
                  }${active ? " is-active" : ""}`}
                  id={`${fieldId}-option-${index}`}
                  key={option.value}
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectOption(option)}
                  onPointerMove={() => setActiveIndex(index)}
                >
                  <span>{option.label}</span>

                  {selected && (
                    <span
                      className="custom-select-check"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

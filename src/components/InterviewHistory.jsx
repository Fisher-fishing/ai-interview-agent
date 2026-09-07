import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getInterview,
} from "../services/interviewApi";

const dateFormatter = new Intl.DateTimeFormat(
  "zh-CN",
  {
    dateStyle: "medium",
    timeStyle: "short",
  },
);

function formatDate(timestamp) {
  return dateFormatter.format(
    new Date(Number(timestamp)),
  );
}

export function InterviewHistory({
  history,
  historyLoading,
  historyError,
  clearHistory,
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] =
    useState(false);
  const [detailError, setDetailError] = useState("");
  const [selectedInterview, setSelectedInterview] =
    useState(null);
  const detailCacheRef = useRef(new Map());
  const detailRequestIdRef = useRef(0);

  useEffect(() => {
    if (!detailOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeDetail();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [detailOpen]);

  async function openDetail(interviewId) {
    setDetailOpen(true);
    setDetailError("");

    const cachedInterview =
      detailCacheRef.current.get(interviewId);

    if (cachedInterview) {
      detailRequestIdRef.current += 1;
      setSelectedInterview(cachedInterview);
      setDetailLoading(false);
      return;
    }

    const requestId = detailRequestIdRef.current + 1;
    detailRequestIdRef.current = requestId;
    setDetailLoading(true);
    setSelectedInterview(null);

    try {
      const data = await getInterview(interviewId);

      detailCacheRef.current.set(
        interviewId,
        data.interview,
      );

      if (detailRequestIdRef.current !== requestId) {
        return;
      }

      setSelectedInterview(data.interview);
    } catch (error) {
      if (detailRequestIdRef.current !== requestId) {
        return;
      }

      setDetailError(error.message);
    } finally {
      if (detailRequestIdRef.current === requestId) {
        setDetailLoading(false);
      }
    }
  }

  function closeDetail() {
    detailRequestIdRef.current += 1;
    setDetailOpen(false);
    setDetailLoading(false);
    setDetailError("");
    setSelectedInterview(null);
  }

  async function handleClearHistory() {
    await clearHistory();
    detailCacheRef.current.clear();
    closeDetail();
  }

  return (
    <>
      <section className="panel history-panel">
        <div className="history-header">
          <div>
            <p className="section-number">04</p>
            <h2>练习记录</h2>
          </div>

          {history.length > 0 && (
            <button
              className="clear-history-button"
              type="button"
              onClick={handleClearHistory}
            >
              清空记录
            </button>
          )}
        </div>

        {historyLoading ? (
          <p className="history-status">
            正在加载练习记录……
          </p>
        ) : historyError ? (
          <p className="history-status history-status-error">
            {historyError}
          </p>
        ) : history.length === 0 ? (
          <p className="history-empty">
            完成一次模拟面试后，记录会保存到当前账号。
          </p>
        ) : (
          <div className="history-list">
            {history.map((record) => (
              <button
                className="history-item history-item-button"
                type="button"
                key={record.id}
                onClick={() => openDetail(record.id)}
              >
                <div>
                  <h3>{record.role}</h3>
                  <p>{record.interviewType}</p>
                </div>

                <div className="history-meta">
                  <strong>
                    {record.answerCount} 道题
                  </strong>

                  <time dateTime={record.createdAt}>
                    {formatDate(record.createdAt)}
                  </time>

                  <span className="view-detail-text">
                    查看详情
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {detailOpen && (
        <div
          className="history-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDetail();
            }
          }}
        >
          <section
            className="history-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-detail-title"
          >
            <header className="history-modal-header">
              <div>
                <p className="section-number">
                  练习详情
                </p>

                <h2 id="history-detail-title">
                  {selectedInterview?.role ??
                    "正在读取记录"}
                </h2>
              </div>

              <button
                className="history-modal-close"
                type="button"
                aria-label="关闭练习详情"
                onClick={closeDetail}
              >
                ×
              </button>
            </header>

            {detailLoading && (
              <p className="history-detail-status">
                正在加载完整回答……
              </p>
            )}

            {detailError && (
              <div className="history-detail-error">
                <p>{detailError}</p>

                <button
                  className="secondary-button"
                  type="button"
                  onClick={closeDetail}
                >
                  关闭
                </button>
              </div>
            )}

            {selectedInterview && (
              <>
                <div className="history-detail-meta">
                  <span>
                    {selectedInterview.interviewType}
                  </span>

                  <span>
                    {selectedInterview.answerCount} 道题
                  </span>

                  <time
                    dateTime={
                      selectedInterview.createdAt
                    }
                  >
                    {formatDate(
                      selectedInterview.createdAt,
                    )}
                  </time>
                </div>

                <div className="history-detail-answers">
                  {selectedInterview.answers.map(
                    (item) => (
                      <article
                        className="history-detail-answer"
                        key={item.questionOrder}
                      >
                        <span>
                          问题 {item.questionOrder}
                        </span>

                        <h3>{item.question}</h3>

                        <div>
                          <strong>我的回答</strong>
                          <p>{item.answer}</p>
                        </div>
                      </article>
                    ),
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}

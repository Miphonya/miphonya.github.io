import { useState } from "react";
export function BrandName() {
  const [failed, setFailed] = useState(false);
  return <span className="brand-name" role="img" aria-label="šotm">
    {failed ? <span className="human-name" aria-hidden="true">šotm</span> :
      <img src={import.meta.env.BASE_URL + "app/sotm/wordmark.svg"} alt="" aria-hidden="true" onError={() => setFailed(true)} />}
  </span>;
}

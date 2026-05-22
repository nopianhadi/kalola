import { Navigate, useParams } from "react-router-dom";

export const RedirectWithParams = ({ to }: { to: string }) => {
    const params = useParams();
    let resolvedTo = to;
    for (const [key, value] of Object.entries(params)) {
        resolvedTo = resolvedTo.replace(`:${key}`, value || "");
    }
    return <Navigate to={resolvedTo} replace />;
};

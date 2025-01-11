import { OperationStatus } from "@/enums";
import { Typography } from "@/components/foundation";

type CardStatusProps = {
    status: OperationStatus | undefined;
};

function CardStatus({ status }: CardStatusProps) {
    return (
        <>
            {status === OperationStatus.ACCEPTED && (
                <Typography className="text-success">Aprovada</Typography>
            )}
            {status === OperationStatus.REJECTED && (
                <Typography className="text-danger">Rejeitada</Typography>
            )}
            {status === OperationStatus.REVIEW && (
                <Typography className="text-primary">
                    Requisição em análise
                </Typography>
            )}
        </>
    );
}

export default CardStatus;

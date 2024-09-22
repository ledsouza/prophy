import Image, { ImageProps } from "next/image";

type HeaderFormProps = ImageProps & {
    title?: string;
    subtitle?: string;
};

const HeaderForm = ({
    src,
    alt,
    title,
    subtitle,
    ...props
}: HeaderFormProps) => {
    return (
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-2">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <Image
                    className="mx-auto h-10 w-auto"
                    src={src}
                    alt={alt}
                    {...props}
                />
                {title && (
                    <h2
                        data-testid="title-form"
                        className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-text-primary"
                    >
                        {title}
                    </h2>
                )}
                {subtitle && (
                    <p
                        data-testid="subtitle-form"
                        className="text-center text-xl leading-9 tracking-tight text-text-secondary"
                    >
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
};

export default HeaderForm;

import { Check, X } from "lucide-react";

const PassCriteria = ({password} : { password: string }) => {
    const criteria = [
        { label: "Al menos 8 caracteres", met: password.length >= 8 },
        { label: "Tiene mayúsculas", met: /[A-Z]/.test(password) },
        { label: "Tiene minúsculas", met: /[a-z]/.test(password) },
        { label: "Tiene un número", met: /\d/.test(password) },
        { label: "Tiene un caracter especial", met: /[^A-Za-z0-9]/.test(password) }
    ]

    return(
        <div className='mt-2 space-y-1'>
            {criteria.map((item) => (
                <div key={item.label} className="flex items-center text-sm">
                    {item.met ? (
                        <Check className="size-4 text-green-500 mr-2" />
                    )
                    : (
                        <X className="size-4 text-red-500 mr-2"/>
                    )}
                    <span className={item.met ? 'text-black dark:text-white' : 'text-neutral-600 dark:text-gray-300'}>
                        {item.label}
                    </span>
                </div>
            ))}

        </div>
    )
}

const PasswordSM = ({password} : { password: string }) => {
    const getStrength = (pass : string) => {
        let strength = 0;
        if (pass.length >= 8) strength++;
        if (pass.match(/[A-Z]/) && pass.match(/[a-z]/)) strength++;
        if(pass.match(/\d/)) strength++;
        if(pass.match(/[^a-zA-Z\d]/)) strength++;
        return strength;
    };

    const strength = getStrength(password);

    const getColor = (strength : number) => {
        //console.log(strength)
        if (strength === 0) return "bg-red-500";
        if (strength === 1) return "bg-red-400";
        if (strength === 2) return "bg-yellow-500";
        if (strength === 3) return "bg-yellow-400";
        return "bg-green-500";
    };

    const getStrengthText = (strength : number) => {
        if (strength === 0) return "Muy baja";
        if (strength === 1) return "Baja";
        if (strength === 2) return "Normal"
        if (strength === 3) return "Buena"
        return "Fuerte"
    };

    return(
        <div className="mt-2">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-black dark:text-white">Seguridad:</span>
                <span className="text-xs text-black dark:text-white">{getStrengthText(strength)}</span>
            </div>

            <div className="flex space-x-1">
                {[...Array(4)].map((_, index) => (
                    <div key={index}
                        className={`h-1 w-1/4 rounded-full transition-colors duration-300
                            ${ index < strength ? getColor(strength) : 'bg-gray-600' }`
                        }
                    />
                ))}
            </div>

            <PassCriteria password={password} />
        </div>
    )
}

export default PasswordSM;
import Image from "next/image"
import { FaGithubSquare, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";
import { useRive } from "@rive-app/react-canvas";

export default function Footer() {
    const { RiveComponent } = useRive({
        src: '/cat1.riv',
        artboard: 'Artboard',
        stateMachines: ['State Machine 1'],
        autoplay: true,
    });

    return (
        <footer className="py-8 px-4 w-full bg-background">
            <div className="max-w-[1152px] mx-auto">
                <div className="flex w-full items-end justify-end">
                <RiveComponent width={400} className="flex items-end justify-start self-end max-w-[222px] pl-9 h-20 translate-y-[36px]" />
                </div>            
                <div className="bg-muted-foreground/10 w-full h-[0.3px] mt-1 mb-4"/>
                <div className="flex py-4 px-2 justify-between">
                    <div className="flex items-center  text-muted-foreground gap-4">
                    <Image src="/logoclakete.svg" alt="Clakete" width={128} height={128}/>
                    <ul className="flex gap-4 text-sm">
                        <li>© 2025 Clakete</li>
                        <li>•</li>
                        <li>Privacy Policy</li>  
                        <li>Terms of Service</li>
                        <li>|</li>
                        <li>Film data from <a href="https://www.themoviedb.org/" className="underline">The Movie Database</a></li>
                    </ul>
                    </div> 
                    <div className="flex text-muted-foreground gap-2">
                        <FaGithubSquare size={16}/>
                        <FaLinkedin size={16}/>
                        <FaInstagram size={16}/>
                        <FaTwitter size={16}/>
                    </div>
                </div>
            </div>
        </footer>
    )
}
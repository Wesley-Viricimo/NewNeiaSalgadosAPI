import { IsNotEmpty } from 'class-validator';

export class CreateCategoryDto {
    @IsNotEmpty({ message: "O campo de descrição não pode ser vazio!" })
    description: string;
}

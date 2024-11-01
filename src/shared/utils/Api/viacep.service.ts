import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ViaCepService {
    constructor(
        private readonly httpService: HttpService
    ){}

    async fetch(cep: string) {
        const url = `http://viacep.com.br/ws/${cep}/json/`;
        return (await lastValueFrom(this.httpService.get(url))).data;
    }
}
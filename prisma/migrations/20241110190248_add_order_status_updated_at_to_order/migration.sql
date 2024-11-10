-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "sales";

-- CreateTable
CREATE TABLE "sales"."User" (
    "idUser" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "cpf" VARCHAR(11) NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CLIENTE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("idUser")
);

-- CreateTable
CREATE TABLE "sales"."Address" (
    "idAddress" SERIAL NOT NULL,
    "cep" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "road" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "idUser" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("idAddress")
);

-- CreateTable
CREATE TABLE "sales"."Product" (
    "idProduct" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "urlImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("idProduct")
);

-- CreateTable
CREATE TABLE "sales"."Order" (
    "idOrder" SERIAL NOT NULL,
    "idAddress" INTEGER NOT NULL,
    "idUser" INTEGER NOT NULL,
    "orderStatus" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "typeOfDelivery" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "isPending" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orderStatusUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("idOrder")
);

-- CreateTable
CREATE TABLE "sales"."OrderItem" (
    "idOrderItem" SERIAL NOT NULL,
    "idProduct" INTEGER NOT NULL,
    "idOrder" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("idOrderItem")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_cpf_key" ON "sales"."User"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "sales"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_description_key" ON "sales"."Product"("description");

-- AddForeignKey
ALTER TABLE "sales"."Address" ADD CONSTRAINT "Address_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "sales"."User"("idUser") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales"."Order" ADD CONSTRAINT "Order_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "sales"."User"("idUser") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales"."Order" ADD CONSTRAINT "Order_idAddress_fkey" FOREIGN KEY ("idAddress") REFERENCES "sales"."Address"("idAddress") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales"."OrderItem" ADD CONSTRAINT "OrderItem_idOrder_fkey" FOREIGN KEY ("idOrder") REFERENCES "sales"."Order"("idOrder") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales"."OrderItem" ADD CONSTRAINT "OrderItem_idProduct_fkey" FOREIGN KEY ("idProduct") REFERENCES "sales"."Product"("idProduct") ON DELETE CASCADE ON UPDATE CASCADE;

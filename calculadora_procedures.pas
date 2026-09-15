program CalculadoraConProcedures;

var
  numero1, numero2: real;

procedure MostrarTitulo;
begin
  writeln('CALCULADORA CON PROCEDURES');
  writeln('---------------------------');
end;

procedure LeerNumeros(var primero, segundo: real);
begin
  write('Ingrese el primer numero: ');
  readln(primero);
  write('Ingrese el segundo numero: ');
  readln(segundo);
end;

procedure MostrarSuma(primero, segundo: real);
begin
  writeln('Suma: ', primero + segundo:0:2);
end;

procedure MostrarResta(primero, segundo: real);
begin
  writeln('Resta: ', primero - segundo:0:2);
end;

procedure MostrarMultiplicacion(primero, segundo: real);
begin
  writeln('Multiplicacion: ', primero * segundo:0:2);
end;

procedure MostrarDivision(primero, segundo: real);
begin
  if segundo <> 0 then
    writeln('Division: ', primero / segundo:0:2)
  else
    writeln('Division: no se puede dividir entre cero.');
end;

procedure MostrarResultados(primero, segundo: real);
begin
  writeln;
  writeln('RESULTADOS');
  MostrarSuma(primero, segundo);
  MostrarResta(primero, segundo);
  MostrarMultiplicacion(primero, segundo);
  MostrarDivision(primero, segundo);
end;

begin
  MostrarTitulo;
  LeerNumeros(numero1, numero2);
  MostrarResultados(numero1, numero2);
  readln;
end.

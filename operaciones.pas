program Operaciones;

var
  numero1, numero2: real;

begin
  writeln('OPERACIONES ARITMETICAS');
  writeln('------------------------');
  write('Ingrese el primer numero: ');
  readln(numero1);
  write('Ingrese el segundo numero: ');
  readln(numero2);

  writeln;
  writeln('Suma: ', numero1 + numero2:0:2);
  writeln('Resta: ', numero1 - numero2:0:2);
  writeln('Multiplicacion: ', numero1 * numero2:0:2);

  if numero2 <> 0 then
    writeln('Division: ', numero1 / numero2:0:2)
  else
    writeln('Division: no se puede dividir entre cero.');

  readln;
end.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/auth/presentation/widgets/rijvia_auth_field.dart';

void main() {
  testWidgets(
    'external auth label names the editable input and keeps its toggle separate',
    (tester) async {
      final semantics = tester.ensureSemantics();
      final input = TextFormField(
        obscureText: true,
        decoration: InputDecoration(
          suffixIcon: IconButton(
            tooltip: 'Show password',
            onPressed: () {},
            icon: const Icon(Icons.visibility_outlined),
          ),
        ),
      );
      final field = RijviaAuthField(label: 'Password', child: input);
      await tester.pumpWidget(MaterialApp(home: Scaffold(body: field)));
      final editable = tester.getSemantics(find.byType(EditableText));
      expect(editable.getSemanticsData().label, contains('Password'));
      final toggle = tester.getSemantics(find.byType(IconButton));
      expect(toggle.id, isNot(editable.id));
      final toggleData = toggle.getSemanticsData();
      expect(
        '${toggleData.label} ${toggleData.tooltip}',
        contains('Show password'),
      );
      semantics.dispose();
    },
  );
}

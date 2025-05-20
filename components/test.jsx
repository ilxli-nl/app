"use client";
import submitForm from "@/app/actions/actions";
import { useForm, useStore } from "@tanstack/react-form";
import { useState } from "react";

const Form = () => {
  const [response, setResponse] = useState(null);


  const form = useForm({
    defaultValues: {
      fullname: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validators: {
      onChange: ({ value }) => {
        if (!/\S+@\S+\.\S+/.test(value.email)) {
          return "Email address not valid";
        }
      },
    },
    onSubmit: async ({ value }) => {
      //Do somethig here
      console.log("Form Values are : ", value);

      const result = await submitForm(value);
      setResponse(result.message);

      if (result.success) {

        
        form.reset();
      }
    },
  });
console.log("useState message: " + response)
  const formErrorMap = useStore(form.store, (state) => state.errorMap);

  return (
    <div>
      <h2>Next.js + Tanstack Form</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="fullname"
          validators={{
            onChange: ({ value }) =>
              !value
                ? "Fullname is required"
                : value.length < 3
                ? "Fullname must be at least 3 characters"
                : undefined,
          }}
          children={(field) => (
            <div>
              <label htmlFor={field.name}>Fullname</label>
              <input
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors ? (
                <em role="alert">{field.state.meta.errors}</em>
              ) : null}
            </div>
          )}
        />
        <form.Field name="email">
          {(field) => (
            <div>
              <label htmlFor={field.name}>Email</label>
              <input
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {formErrorMap.onChange ? (
                <em role="alert">{formErrorMap.onChange}</em>
              ) : null}
            </div>
          )}
        </form.Field>
        <form.Field name="password">
          {(field) => (
            <div>
              <label htmlFor={field.name}>Password</label>
              <input
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>
        <form.Field
          name="confirmPassword"
          validators={{
            onChangeListenTo: ["password"],
            onChange: ({ value, fieldApi }) => {
              if (value !== fieldApi.form.getFieldValue("password")) {
                return "Passwords do not match";
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <div>
              <label htmlFor={field.name}>Confirm Pass</label>
              <input
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors ? (
                <em role="alert">{field.state.meta.errors}</em>
              ) : null}
            </div>
          )}
        </form.Field>
        <button type="submit">Submit</button>
        {response && <p>{response}</p>}
      </form>
    </div>
  );
};

export default Form;